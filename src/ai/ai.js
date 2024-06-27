import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function sendMessageToAssistant(threadId, username, content) {
	const response = await openai.beta.threads.messages.create(threadId, {
		role: "user",
		content: `사용자 이름 : ${username}, 
              꿈 내용 : ${content}`,
	});

	return response;
}

export async function createRun(threadId, assistantId) {
	const run = await openai.beta.threads.runs.create(threadId, {
		assistant_id: assistantId,
	});
	return run;
}

export async function waitRun(run, threadId) {
	// 실행 완료 될 때까지 반복
	// status가 "queued" 또는 "in_progress"인 경우 계속 대기
	while (run.status === "queued" || run.status === "in_progress") {
		// run.status를 업데이트
		run = await openai.beta.threads.runs.retrieve(threadId, run.id);
		// 서버 부하 줄이기
		await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5초 대기
	}
	return run;
}

export async function receiveMessage(threadId) {
	const response = await openai.beta.threads.messages.list(threadId, "asc");
	return response;
}

async function main() {
	const assistantId = process.env.ASSISTANT_ID;
	const threadId = process.env.THREAD_ID;

	try {
		// 메시지 전송 및 응답 받기
		const message = await sendMessageToAssistant(
			threadId,
			"황현민",
			"유령이 나를 죽이러 오는 꿈을 꾸었어",
		);
		// console.log("질문: ", userMessage);

		// Run 생성
		const run = await createRun(threadId, assistantId);
		// console.log("Run created:", run);

		// 기다리기
		await waitRun(run, threadId);
		// console.log(result);

		const response = await receiveMessage(threadId);

		console.log(response.data[0].content[0].text.value);
	} catch (error) {
		console.error("Error:", error);
	}
}

// main();
