package controller

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/gin-gonic/gin"
)

type Song struct {
	Year        int    `dynamodbav:"year"`
	Timestamp   int    `dynamodbav:"timestamp"`
	Id          string `dynamodbav:"id"`
	Album_name  string `dynamodbav:"album_name"`
	Album_url   string `dynamodbav:"album_url"`
	Artist_name string `dynamodbav:"artist_name"`
	Artist_url  string `dynamodbav:"artist_url"`
	Track_name  string `dynamodbav:"track_name"`
	Track_url   string `dynamodbav:"track_url"`
}

func SongController(client *dynamodb.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		queryParams := &dynamodb.QueryInput{
			TableName:              aws.String("spotify"),
			KeyConditionExpression: aws.String("#year = :hashKey and #timestamp < :rangeKey"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":hashKey":  &types.AttributeValueMemberN{Value: "2022"},
				":rangeKey": &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().UnixMilli(), 10)},
			},
			ExpressionAttributeNames: map[string]string{
				"#year":      "year",
				"#timestamp": "timestamp",
			},
			ScanIndexForward: aws.Bool(false),
		}

		if lim := c.Query("limit"); lim != "" {
			conv, _ := strconv.ParseInt(lim, 10, 32)
			toInt32 := int32(conv)
			queryParams.Limit = &toInt32
		}

		out, err := client.Query(context.TODO(), queryParams)
		if err != nil {
			panic(err)
		}
		songs := make([]Song, 0)
		if err := attributevalue.UnmarshalListOfMaps(out.Items, &songs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "error"})
		}
		c.JSON(http.StatusOK, songs)
	}
}
