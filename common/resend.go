package common

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type resendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func sendEmailWithResend(subject, receiver, content string) error {
	if strings.TrimSpace(ResendAPIKey) == "" {
		return fmt.Errorf("Resend API key is not configured")
	}
	if strings.TrimSpace(ResendFrom) == "" {
		return fmt.Errorf("Resend sender is not configured")
	}
	payload, err := Marshal(resendEmailRequest{
		From:    ResendFrom,
		To:      []string{receiver},
		Subject: subject,
		HTML:    content,
	})
	if err != nil {
		return fmt.Errorf("marshal Resend email: %w", err)
	}
	req, err := http.NewRequest(http.MethodPost, ResendAPIURL, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create Resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+ResendAPIKey)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("send Resend email: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("Resend returned HTTP %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}
