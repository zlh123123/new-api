package common

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSendEmailWithResend(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, http.MethodPost, r.Method)
		require.Equal(t, "Bearer test-key", r.Header.Get("Authorization"))
		require.Equal(t, "application/json", r.Header.Get("Content-Type"))
		body, _ := io.ReadAll(r.Body)
		payload := string(body)
		require.Contains(t, payload, "Haoji API")
		require.Contains(t, payload, "no-reply@haojiapi.me")
		require.Contains(t, payload, "Verify")
		w.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()

	oldKey, oldFrom, oldURL := ResendAPIKey, ResendFrom, ResendAPIURL
	ResendAPIKey, ResendFrom, ResendAPIURL = "test-key", "Haoji API <no-reply@haojiapi.me>", server.URL
	t.Cleanup(func() { ResendAPIKey, ResendFrom, ResendAPIURL = oldKey, oldFrom, oldURL })

	require.NoError(t, sendEmailWithResend("Verify", "user@example.com", "<p>123456</p>"))
}

func TestSendEmailWithResendRejectsFailedResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"message":"invalid api key"}`))
	}))
	defer server.Close()

	oldKey, oldFrom, oldURL := ResendAPIKey, ResendFrom, ResendAPIURL
	ResendAPIKey, ResendFrom, ResendAPIURL = "bad-key", "no-reply@haojiapi.me", server.URL
	t.Cleanup(func() { ResendAPIKey, ResendFrom, ResendAPIURL = oldKey, oldFrom, oldURL })

	err := sendEmailWithResend("Verify", "user@example.com", "<p>123456</p>")
	require.Error(t, err)
	require.Contains(t, err.Error(), "HTTP 401")
}
