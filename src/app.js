const express = require("express");
const cors = require("cors");
const {
	sendMessageToAssistant,
	createRun,
	waitRun,
	receiveMessage,
	GenerateImage,
} = require("./ai/ai");
const { connectToDatabase, getDb } = require("./util/database");
const { ObjectId } = require("mongodb");

const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectToDatabase()
	.then(() => {
		app.listen(8080, () => {
			console.log("http://localhost:8080/ 서버 실행중");
		});
	})
	.catch((err) => {
		console.error(err);
	});

app.get("/", (req, res) => {
	res.send("");
});

const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
	region: "ap-northeast-2",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

app.post("/gpt", async (req, res) => {
	console.log(req.body);
	if (req.body.name === "" || req.body.content === "") {
		res.send("메세지가 없습니다.");
	} else {
		try {
			const url = await GenerateImage(req.body.content);
			console.log(url);

			const responseImg = await axios.get(url, { responseType: "arraybuffer" });
			// console.log(responseImg);

			const buffer = Buffer.from(responseImg.data, "binary");
			const convertedImageBuffer = await sharp(buffer).png().toBuffer();
			console.log(convertedImageBuffer);

			const timestamp = Date.now();
			const filename = `${timestamp}.png`;
			const filePath = path.join(__dirname, "img", filename);

			await fs.writeFile(filePath, convertedImageBuffer, (e) => {
				// console.log(e);
			});

			const uploadParams = {
				Bucket: process.env.S3_BUCKET_NAME,
				Key: `images/${filename}`,
				Body: convertedImageBuffer,
				ContentType: "image/png",
			};

			const s3Data = await s3.send(new PutObjectCommand(uploadParams));
			console.log(s3Data);

			const imageUrl = `https://${uploadParams.Bucket}.s3.amazonaws.com/${uploadParams.Key}`;
			console.log(imageUrl);

			sendMessageToAssistant(
				process.env.THREAD_ID,
				req.body.name,
				req.body.content,
			);
			const run = await createRun(
				process.env.THREAD_ID,
				process.env.ASSISTANT_ID,
			);
			await waitRun(run, process.env.THREAD_ID);
			const response = await receiveMessage(process.env.THREAD_ID);

			const parsedResponse = JSON.parse(response.data[0].content[0].text.value);
			console.log(parsedResponse);

			const db = getDb();
			try {
				const result = await db
					.collection("list")
					.insertOne({ ...parsedResponse, imageUrl });
				console.log("DB 저장 성공:", result.insertedId);
				res.json({
					id: result.insertedId,
					data: { ...parsedResponse, imageUrl },
				});
			} catch (err) {
				console.error("DB 저장 실패:", err);
				res.status(500).send("DB 저장 중 오류 발생");
			}
		} catch (err) {
			console.error("에러 발생:", err);
			res.status(500).send("작업 중 오류 발생");
		}
	}
});

app.get("/get/:id", async (req, res) => {
	const { id } = req.params;

	const db = getDb();
	try {
		const result = await db
			.collection("list")
			.findOne({ _id: new ObjectId(id) });
		if (!result) {
			res.status(404).send("해당 ID로 데이터를 찾을 수 없습니다.");
			return;
		}
		res.json(result);
	} catch (err) {
		console.error("데이터 조회 중 오류 발생:", err);
		res.status(500).send("데이터 조회 중 오류 발생");
	}
});

app.get("/list", async (req, res) => {
	const db = getDb();
	try {
		const result = await db.collection("list").find().toArray();
		res.json(result);
	} catch (err) {
		console.error("데이터 조회 중 오류 발생:", err);
		res.status(500).send("데이터 조회 중 오류 발생");
	}
});
