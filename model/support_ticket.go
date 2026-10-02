package model

import (
	"errors"
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	TicketStatusOpen   = "open"
	TicketStatusClosed = "closed"
	TicketRoleUser     = "user"
	TicketRoleAdmin    = "admin"
)

type SupportTicket struct {
	Id            int                    `json:"id"`
	UserId        int                    `json:"user_id" gorm:"index"`
	Subject       string                 `json:"subject" gorm:"type:varchar(160)"`
	Category      string                 `json:"category" gorm:"type:varchar(40)"`
	Status        string                 `json:"status" gorm:"type:varchar(20);index"`
	UserUnread    bool                   `json:"user_unread"`
	AdminUnread   bool                   `json:"admin_unread"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	LastMessageAt time.Time              `json:"last_message_at"`
	Messages      []SupportTicketMessage `json:"messages,omitempty" gorm:"foreignKey:TicketId"`
}

type SupportTicketMessage struct {
	Id          int                       `json:"id"`
	TicketId    int                       `json:"ticket_id" gorm:"index"`
	UserId      int                       `json:"user_id" gorm:"index"`
	Role        string                    `json:"role" gorm:"type:varchar(10)"`
	Content     string                    `json:"content" gorm:"type:text"`
	CreatedAt   time.Time                 `json:"created_at"`
	Attachments []SupportTicketAttachment `json:"attachments,omitempty" gorm:"foreignKey:MessageId"`
}

type SupportTicketAttachment struct {
	Id           int       `json:"id"`
	TicketId     int       `json:"ticket_id" gorm:"index"`
	MessageId    int       `json:"message_id" gorm:"index"`
	OriginalName string    `json:"original_name" gorm:"type:varchar(255)"`
	StoredName   string    `json:"stored_name" gorm:"type:varchar(255);uniqueIndex"`
	MimeType     string    `json:"mime_type" gorm:"type:varchar(100)"`
	Size         int64     `json:"size"`
	CreatedAt    time.Time `json:"created_at"`
}

type SupportNotification struct {
	Id        int        `json:"id"`
	UserId    int        `json:"user_id" gorm:"index"`
	TicketId  int        `json:"ticket_id" gorm:"index"`
	Type      string     `json:"type" gorm:"type:varchar(30)"`
	Title     string     `json:"title" gorm:"type:varchar(160)"`
	Content   string     `json:"content" gorm:"type:text"`
	ReadAt    *time.Time `json:"read_at"`
	CreatedAt time.Time  `json:"created_at"`
}

var ErrTicketNotFound = errors.New("support ticket not found")

func CreateSupportTicket(ticket *SupportTicket, message *SupportTicketMessage, attachments []SupportTicketAttachment) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(ticket).Error; err != nil {
			return err
		}
		message.TicketId = ticket.Id
		if err := tx.Create(message).Error; err != nil {
			return err
		}
		for i := range attachments {
			attachments[i].TicketId = ticket.Id
			attachments[i].MessageId = message.Id
		}
		if len(attachments) > 0 {
			if err := tx.Create(&attachments).Error; err != nil {
				return err
			}
		}
		admins := make([]User, 0)
		if err := tx.Where("role >= ? AND status = ?", common.RoleAdminUser, common.UserStatusEnabled).Find(&admins).Error; err != nil {
			return err
		}
		notifications := make([]SupportNotification, 0, len(admins))
		for _, admin := range admins {
			notifications = append(notifications, SupportNotification{UserId: admin.Id, TicketId: ticket.Id, Type: "ticket_created", Title: "New support ticket", Content: ticket.Subject})
		}
		if len(notifications) > 0 {
			return tx.Create(&notifications).Error
		}
		return nil
	})
}

func GetSupportTickets(userId int, admin bool) ([]SupportTicket, error) {
	var tickets []SupportTicket
	q := DB.Order("last_message_at desc")
	if !admin {
		q = q.Where("user_id = ?", userId)
	}
	if err := q.Find(&tickets).Error; err != nil {
		return nil, err
	}
	return tickets, nil
}

func GetSupportTicket(id, userId int, admin bool) (*SupportTicket, error) {
	var ticket SupportTicket
	q := DB.Where("id = ?", id)
	if !admin {
		q = q.Where("user_id = ?", userId)
	}
	if err := q.Preload("Messages", func(tx *gorm.DB) *gorm.DB { return tx.Order("created_at asc") }).Preload("Messages.Attachments").First(&ticket).Error; err != nil {
		return nil, ErrTicketNotFound
	}
	return &ticket, nil
}

func AddSupportTicketMessage(ticket *SupportTicket, message *SupportTicketMessage, attachments []SupportTicketAttachment, admin bool) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if ticket.Status == TicketStatusClosed {
			ticket.Status = TicketStatusOpen
		}
		message.TicketId = ticket.Id
		if err := tx.Create(message).Error; err != nil {
			return err
		}
		for i := range attachments {
			attachments[i].TicketId = ticket.Id
			attachments[i].MessageId = message.Id
		}
		if len(attachments) > 0 {
			if err := tx.Create(&attachments).Error; err != nil {
				return err
			}
		}
		now := time.Now()
		updates := map[string]interface{}{"status": ticket.Status, "updated_at": now, "last_message_at": now, "user_unread": admin, "admin_unread": !admin}
		if err := tx.Model(&SupportTicket{}).Where("id = ?", ticket.Id).Updates(updates).Error; err != nil {
			return err
		}
		if admin {
			return tx.Create(&SupportNotification{UserId: ticket.UserId, TicketId: ticket.Id, Type: "ticket_reply", Title: "Support replied", Content: ticket.Subject}).Error
		}
		admins := make([]User, 0)
		if err := tx.Where("role >= ? AND status = ?", common.RoleAdminUser, common.UserStatusEnabled).Find(&admins).Error; err != nil {
			return err
		}
		notifications := make([]SupportNotification, 0, len(admins))
		for _, adminUser := range admins {
			notifications = append(notifications, SupportNotification{UserId: adminUser.Id, TicketId: ticket.Id, Type: "ticket_message", Title: "Support ticket updated", Content: ticket.Subject})
		}
		if len(notifications) > 0 {
			return tx.Create(&notifications).Error
		}
		return nil
	})
}

func SetSupportTicketStatus(id, userId int, admin bool, status string) error {
	q := DB.Model(&SupportTicket{}).Where("id = ?", id)
	if !admin {
		q = q.Where("user_id = ?", userId)
	}
	return q.Update("status", status).Error
}

func ListSupportNotifications(userId int, unreadOnly bool) ([]SupportNotification, int64, error) {
	var items []SupportNotification
	q := DB.Where("user_id = ?", userId).Order("created_at desc").Limit(50)
	if unreadOnly {
		q = q.Where("read_at IS NULL")
	}
	if err := q.Find(&items).Error; err != nil {
		return nil, 0, err
	}
	var count int64
	if err := DB.Model(&SupportNotification{}).Where("user_id = ? AND read_at IS NULL", userId).Count(&count).Error; err != nil {
		return nil, 0, err
	}
	return items, count, nil
}

func MarkSupportNotificationRead(id, userId int) error {
	now := time.Now()
	return DB.Model(&SupportNotification{}).Where("id = ? AND user_id = ?", id, userId).Update("read_at", &now).Error
}
func MarkAllSupportNotificationsRead(userId int) error {
	now := time.Now()
	return DB.Model(&SupportNotification{}).Where("user_id = ? AND read_at IS NULL", userId).Update("read_at", &now).Error
}
