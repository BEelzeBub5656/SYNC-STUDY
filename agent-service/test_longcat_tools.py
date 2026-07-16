import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

api_key = os.getenv("LONGCAT_API_KEY")
base_url = os.getenv("LONGCAT_BASE_URL")
model = os.getenv("LONGCAT_MODEL")

if not api_key:
    raise RuntimeError("没有读取到 LONGCAT_API_KEY")

if not base_url:
    raise RuntimeError("没有读取到 LONGCAT_BASE_URL")

if not model:
    raise RuntimeError("没有读取到 LONGCAT_MODEL")


client = OpenAI(
    api_key=api_key,
    base_url=base_url,
)


tools = [
    {
        "type": "function",
        "function": {
            "name": "get_exam_list",
            "description": "查询当前用户的考试列表。",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False,
            },
        },
    }
]


response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "system",
            "content": (
                "你是学习助手。需要查询考试数据时，"
                "必须调用 get_exam_list 工具，不能自行编造考试信息。"
            ),
        },
        {
            "role": "user",
            "content": "我最近有什么考试？",
        },
    ],
    tools=tools,
    tool_choice="auto",
)


message = response.choices[0].message

print("普通文本内容：")
print(message.content)

print("\n标准 tool_calls：")
print(message.tool_calls)


if message.tool_calls:
    print("\n解析后的工具调用：")

    for tool_call in message.tool_calls:
        arguments = json.loads(
            tool_call.function.arguments
        )

        print(
            json.dumps(
                {
                    "id": tool_call.id,
                    "name": tool_call.function.name,
                    "arguments": arguments,
                },
                ensure_ascii=False,
                indent=2,
            )
        )