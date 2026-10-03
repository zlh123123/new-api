package service

import (
	"fmt"
	"html"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

// NotifySupportTicketCreated sends an email to every enabled administrator after
// a user creates a ticket. Email delivery is deliberately asynchronous so an
// SMTP outage cannot make a successful ticket submission fail.
func NotifySupportTicketCreated(ticketID int) {
	go func() {
		var ticket model.SupportTicket
		if err := model.DB.First(&ticket, ticketID).Error; err != nil {
			common.SysError(fmt.Sprintf("support email: load created ticket %d: %v", ticketID, err))
			return
		}
		var admins []model.User
		if err := model.DB.Where("role >= ? AND status = ? AND email <> ''", common.RoleAdminUser, common.UserStatusEnabled).Find(&admins).Error; err != nil {
			common.SysError(fmt.Sprintf("support email: load administrators for ticket %d: %v", ticketID, err))
			return
		}
		subject := fmt.Sprintf("[%s] 新工单：%s", common.SystemName, ticket.Subject)
		content := supportEmailHTML("收到新的用户工单", fmt.Sprintf("用户提交了一个新的支持工单，请登录管理后台查看并回复。<br><br><b>主题：</b>%s", html.EscapeString(ticket.Subject)))
		for _, admin := range admins {
			sendSupportEmail(subject, admin.Email, content)
		}
	}()
}

// NotifySupportTicketReply sends an email to the ticket owner after an
// administrator replies. User replies intentionally do not email administrators
// because the ticket-created and in-app notification paths already cover them.
func NotifySupportTicketReply(ticketID int) {
	go func() {
		var ticket model.SupportTicket
		if err := model.DB.First(&ticket, ticketID).Error; err != nil {
			common.SysError(fmt.Sprintf("support email: load replied ticket %d: %v", ticketID, err))
			return
		}
		var user model.User
		if err := model.DB.Select("id", "email").Where("id = ?", ticket.UserId).First(&user).Error; err != nil {
			common.SysError(fmt.Sprintf("support email: load ticket owner for ticket %d: %v", ticketID, err))
			return
		}
		if strings.TrimSpace(user.Email) == "" {
			return
		}
		subject := fmt.Sprintf("[%s] 工单有新回复：%s", common.SystemName, ticket.Subject)
		content := supportEmailHTML("你的工单有新回复", fmt.Sprintf("管理员已经回复了你的支持工单，请登录网站查看详情。<br><br><b>主题：</b>%s", html.EscapeString(ticket.Subject)))
		sendSupportEmail(subject, user.Email, content)
	}()
}

func sendSupportEmail(subject, receiver, content string) {
	if strings.TrimSpace(receiver) == "" {
		return
	}
	if err := common.SendEmail(subject, receiver, content); err != nil {
		common.SysError(fmt.Sprintf("support email: send to %s failed: %v", receiver, err))
	}
}

func supportEmailHTML(title, body string) string {
	return fmt.Sprintf(`<div style="font-family:Arial,sans-serif;line-height:1.7;color:#222"><h2>%s</h2><p>%s</p><p style="color:#666;font-size:13px">此邮件由 %s 自动发送，请勿直接回复。</p></div>`, html.EscapeString(title), body, html.EscapeString(common.SystemName))
}
