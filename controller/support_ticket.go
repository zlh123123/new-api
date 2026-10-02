package controller

import (
	"crypto/rand"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

const maxTicketAttachmentSize int64 = 5 * 1024 * 1024
const maxTicketAttachments = 5

func ticketUploadDir() string {
	if dir := os.Getenv("SUPPORT_UPLOAD_DIR"); dir != "" {
		return dir
	}
	return filepath.Join("data", "support-attachments")
}

func parseTicketFiles(c *gin.Context, ticketId, messageId int) ([]model.SupportTicketAttachment, error) {
	form, err := c.MultipartForm()
	if err != nil {
		return nil, nil
	}
	files := form.File["files"]
	if len(files) > maxTicketAttachments {
		return nil, fmt.Errorf("at most %d images", maxTicketAttachments)
	}
	if len(files) == 0 {
		return nil, nil
	}
	if err := os.MkdirAll(ticketUploadDir(), 0750); err != nil {
		return nil, err
	}
	result := make([]model.SupportTicketAttachment, 0, len(files))
	for _, header := range files {
		if header.Size <= 0 || header.Size > maxTicketAttachmentSize {
			return nil, fmt.Errorf("each image must be between 1 byte and 5 MB")
		}
		f, err := header.Open()
		if err != nil {
			return nil, err
		}
		defer f.Close()
		probe := make([]byte, 512)
		n, err := f.Read(probe)
		if err != nil && err != io.EOF {
			return nil, err
		}
		mimeType := http.DetectContentType(probe[:n])
		if !strings.HasPrefix(mimeType, "image/") || (mimeType != "image/jpeg" && mimeType != "image/png" && mimeType != "image/gif" && mimeType != "image/webp") {
			return nil, fmt.Errorf("only JPEG, PNG, GIF, or WebP images are supported")
		}
		if _, err := f.Seek(0, io.SeekStart); err != nil {
			return nil, err
		}
		random := make([]byte, 16)
		if _, err := rand.Read(random); err != nil {
			return nil, err
		}
		stored := fmt.Sprintf("%x", random)
		path := filepath.Join(ticketUploadDir(), stored)
		out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
		if err != nil {
			return nil, err
		}
		_, copyErr := io.Copy(out, f)
		closeErr := out.Close()
		if copyErr != nil {
			os.Remove(path)
			return nil, copyErr
		}
		if closeErr != nil {
			os.Remove(path)
			return nil, closeErr
		}
		result = append(result, model.SupportTicketAttachment{TicketId: ticketId, MessageId: messageId, OriginalName: filepath.Base(header.Filename), StoredName: stored, MimeType: mimeType, Size: header.Size})
	}
	return result, nil
}

func formValue(c *gin.Context, key string) string { return strings.TrimSpace(c.PostForm(key)) }

func CreateSupportTicket(c *gin.Context) {
	subject, content := formValue(c, "subject"), formValue(c, "content")
	if subject == "" || len([]rune(subject)) > 160 || content == "" || len([]rune(content)) > 10000 {
		common.ApiError(c, fmt.Errorf("subject and content are required; content must be at most 10000 characters"))
		return
	}
	ticket := &model.SupportTicket{UserId: c.GetInt("id"), Subject: subject, Category: formValue(c, "category"), Status: model.TicketStatusOpen, AdminUnread: true, CreatedAt: time.Now(), UpdatedAt: time.Now(), LastMessageAt: time.Now()}
	message := &model.SupportTicketMessage{UserId: ticket.UserId, Role: model.TicketRoleUser, Content: content, CreatedAt: time.Now()}
	attachments, err := parseTicketFiles(c, 0, 0)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err = model.CreateSupportTicket(ticket, message, attachments); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, ticket)
}

func ListSupportTickets(c *gin.Context) {
	admin := c.GetInt("role") >= common.RoleAdminUser
	items, err := model.GetSupportTickets(c.GetInt("id"), admin)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, items)
}

func GetSupportTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	admin := c.GetInt("role") >= common.RoleAdminUser
	item, err := model.GetSupportTicket(id, c.GetInt("id"), admin)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if admin {
		_ = model.DB.Model(&model.SupportTicket{}).Where("id = ?", id).Update("admin_unread", false).Error
	} else {
		_ = model.DB.Model(&model.SupportTicket{}).Where("id = ? AND user_id = ?", id, c.GetInt("id")).Update("user_unread", false).Error
	}
	common.ApiSuccess(c, item)
}

func ReplySupportTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	admin := c.GetInt("role") >= common.RoleAdminUser
	ticket, err := model.GetSupportTicket(id, c.GetInt("id"), admin)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	content := formValue(c, "content")
	if content == "" || len([]rune(content)) > 10000 {
		common.ApiError(c, fmt.Errorf("content is required and must be at most 10000 characters"))
		return
	}
	message := &model.SupportTicketMessage{TicketId: ticket.Id, UserId: c.GetInt("id"), Role: model.TicketRoleUser, Content: content, CreatedAt: time.Now()}
	if admin {
		message.Role = model.TicketRoleAdmin
	}
	attachments, err := parseTicketFiles(c, ticket.Id, 0)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.AddSupportTicketMessage(ticket, message, attachments, admin); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, message)
}

func UpdateSupportTicketStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	status := formValue(c, "status")
	if status == "" {
		var payload struct {
			Status string `json:"status"`
		}
		if common.DecodeJson(c.Request.Body, &payload) == nil {
			status = payload.Status
		}
	}
	if status != model.TicketStatusOpen && status != model.TicketStatusClosed {
		common.ApiError(c, fmt.Errorf("invalid status"))
		return
	}
	if err := model.SetSupportTicketStatus(id, c.GetInt("id"), c.GetInt("role") >= common.RoleAdminUser, status); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"status": status})
}

func ServeSupportAttachment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	attachment := model.SupportTicketAttachment{}
	if err := model.DB.First(&attachment, id).Error; err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	ticket, err := model.GetSupportTicket(attachment.TicketId, c.GetInt("id"), c.GetInt("role") >= common.RoleAdminUser)
	if err != nil {
		c.Status(http.StatusForbidden)
		return
	}
	_ = ticket
	c.Header("Cache-Control", "private, max-age=3600")
	c.Header("Content-Type", attachment.MimeType)
	c.File(filepath.Join(ticketUploadDir(), attachment.StoredName))
}

func ListSupportNotifications(c *gin.Context) {
	items, count, err := model.ListSupportNotifications(c.GetInt("id"), c.Query("unread_only") == "true")
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"items": items, "unread_count": count})
}
func ReadSupportNotification(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.MarkSupportNotificationRead(id, c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
func ReadAllSupportNotifications(c *gin.Context) {
	if err := model.MarkAllSupportNotificationsRead(c.GetInt("id")); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
