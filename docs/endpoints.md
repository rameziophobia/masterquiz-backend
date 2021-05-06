# Endpoints

All endpoints are after /api/. e.g. /api/quizzes.

## /quizzes

| Request Type | Params   | Description       |
| ------------ | -------- | ----------------- |
| GET          | /        | Returns quiz list |
| POST         | /        | Create quiz       |
| get          | /:quizId | get one quiz      |
| put          | /:quizId | attempt quiz      |
| delete       | /:quizId | delete quiz       |

### [Schema](../api/models/quizzes.js)

#### question attempt

| Name      | Type    | Required |
| --------- | ------- | -------- |
| user      | String  | true     |
| answer    | String  | true     |
| score     | Number  | true     |
| time      | Number  | true     |
| isCorrect | Boolean | true     |

#### question

| Name     | Type              | Required |
| -------- | ----------------- | -------- |
| title    | String            | true     |
| answer   | String            | true     |
| choices  | String[]          | false    |
| attempts | questionAttempt[] | false    |

#### quiz

| Name          | Type       | Required | Note                                  |
| ------------- | ---------- | -------- | ------------------------------------- |
| name          | String     | true     |                                       |
| description   | String     | true     |                                       |
| author        | String     | false    |                                       |
| genres        | String[]   | false    |                                       |
| rating        | Number     | false    | between 0 and 5                       |
| timesAnswered | Number     | false    | default 0                             |
| createdOn     | Date       | false    | default date.now()                    |
| questions     | question[] | true     | unique  question [...choices, answer] |

## sessionCode

| Request Type | Params | Description          |
| ------------ | ------ | -------------------- |
| GET          | /      | get new session code |
