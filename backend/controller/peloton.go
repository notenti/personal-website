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

type Workout struct {
	Difficulty          float64 `dynamodbav:"difficulty"`
	Duration            int     `dynamodbav:"duration"`
	Fitness_Discipline  string  `dynamodbav:"fitness_discipline"`
	Id                  string  `dynamodbav:"id"`
	Timestamp           int     `dynamodbav:"timestamp"`
	Total_work          float64 `dynamodbav:"total_work"`
	Was_personal_record bool    `dynamodbav:"was_personal_record"`
	Workout_title       string  `dynamodbav:"workout_title"`
}

func WorkoutController(client *dynamodb.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		queryParams := &dynamodb.QueryInput{
			TableName:              aws.String("peloton"),
			KeyConditionExpression: aws.String("#fitness_discipline = :hashKey and #timestamp < :rangeKey"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":hashKey":  &types.AttributeValueMemberS{Value: "cycling"},
				":rangeKey": &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().UnixMilli(), 10)},
			},
			ExpressionAttributeNames: map[string]string{
				"#fitness_discipline": "fitness_discipline",
				"#timestamp":          "timestamp",
			},
			ScanIndexForward: aws.Bool(false),
		}

		if dur, ok := c.GetQuery("duration"); ok {
			queryParams = &dynamodb.QueryInput{
				TableName:              aws.String("peloton"),
				KeyConditionExpression: aws.String("#duration = :hashKey and #timestamp < :rangeKey"),
				IndexName:              aws.String("duration-index"),
				ExpressionAttributeValues: map[string]types.AttributeValue{
					":hashKey":  &types.AttributeValueMemberN{Value: dur},
					":rangeKey": &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().UnixMilli(), 10)},
				},
				ExpressionAttributeNames: map[string]string{
					"#duration":  "duration",
					"#timestamp": "timestamp",
				},
				ScanIndexForward: aws.Bool(false),
			}
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
		workouts := make([]Workout, 0)
		if err := attributevalue.UnmarshalListOfMaps(out.Items, &workouts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "error"})
		}
		c.JSON(http.StatusOK, workouts)
	}
}
