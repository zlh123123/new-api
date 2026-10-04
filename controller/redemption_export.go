package controller

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func GetRedemptionCategories(c *gin.Context) {
	names, err := model.GetRedemptionCategories()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, names)
}

func ExportRedemptions(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "兑换码分类不能为空"})
		return
	}

	redemptions, err := model.GetRedemptionsByName(name)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=redemption-codes.csv")
	writer := csv.NewWriter(c.Writer)
	// UTF-8 BOM keeps Chinese category names readable in spreadsheet programs.
	_, _ = c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})
	_ = writer.Write([]string{"兑换码", "分类", "额度（美元）", "内部额度单位", "状态", "创建时间", "兑换时间"})
	for _, redemption := range redemptions {
		_ = writer.Write([]string{
			redemption.Key,
			redemption.Name,
			strconv.FormatFloat(float64(redemption.Quota)/common.QuotaPerUnit, 'f', 6, 64),
			strconv.FormatInt(int64(redemption.Quota), 10),
			redemptionStatusText(redemption.Status),
			formatRedemptionTime(redemption.CreatedTime),
			formatRedemptionTime(redemption.RedeemedTime),
		})
	}
	writer.Flush()
}

func formatRedemptionTime(timestamp int64) string {
	if timestamp == 0 {
		return ""
	}
	return time.Unix(timestamp, 0).Format(time.RFC3339)
}

func redemptionStatusText(status int) string {
	switch status {
	case common.RedemptionCodeStatusEnabled:
		return "未使用"
	case common.RedemptionCodeStatusUsed:
		return "已使用"
	case common.RedemptionCodeStatusDisabled:
		return "已禁用"
	default:
		return "未知"
	}
}
