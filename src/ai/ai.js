const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function GenerateImage(prompt) {
	const response = await openai.images.generate({
		model: "dall-e-3",
		prompt: prompt,
		n: 1,
		size: "1024x1024",
		response_format: "url",
	});
	return response.data[0].url;
}

// async function main() {
// 	const image = await GenerateImage("웹사이트를 만드는 꿈을 꾸었어");
// 	console.log(image);
// }
// main();

async function sendMessageToAssistant(threadId, username, content) {
	const response = await openai.beta.threads.messages.create(threadId, {
		role: "user",
		content: `사용자 이름 : ${username}, 
              꿈 내용 : ${content}`,
	});

	return response;
}

async function createRun(threadId, assistantId) {
	const run = await openai.beta.threads.runs.create(threadId, {
		assistant_id: assistantId,
	});
	return run;
}

async function waitRun(run, threadId) {
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

async function receiveMessage(threadId) {
	const response = await openai.beta.threads.messages.list(threadId, "asc");
	return response;
}

// async function main() {
// 	const assistantId = process.env.ASSISTANT_ID;
// 	const threadId = process.env.THREAD_ID;

// 	try {
// 		// 메시지 전송 및 응답 받기
// 		const message = await sendMessageToAssistant(
// 			threadId,
// 			"황현민",
// 			"돈 비가 내리는 꿈을 꾸었어요!",
// 		);
// 		// console.log("질문: ", userMessage);

// 		// Run 생성
// 		const run = await createRun(threadId, assistantId);
// 		// console.log("Run created:", run);

// 		// 기다리기
// 		await waitRun(run, threadId);
// 		// console.log(result);

// 		const response = await receiveMessage(threadId);

// 		console.log(response.data[0].content[0].text.value);
// 	} catch (error) {
// 		console.error("Error:", error);
// 	}
// }

// main();

module.exports = {
	sendMessageToAssistant,
	createRun,
	waitRun,
	receiveMessage,
	GenerateImage,
};
