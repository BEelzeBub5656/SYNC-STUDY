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

response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "system",
            "content": "你是一个简洁的中文学习助手。",
        },
        {
            "role": "user",
            "content": "请只回复：LongCat 连接成功",
        },
    ],
)

message = response.choices[0].message.content

print(message)