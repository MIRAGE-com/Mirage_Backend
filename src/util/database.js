const { MongoClient } = require("mongodb");
require("dotenv").config();

const url = `mongodb+srv://admin:${process.env.DB_PW}@dreamlist.b0gowbx.mongodb.net/?retryWrites=true&w=majority&appName=DreamList`;

let db;

const connectToDatabase = async () => {
	try {
		const client = await new MongoClient(url).connect();
		console.log("DB 연결 성공");
		db = client.db("dreamlist");
		return db;
	} catch (err) {
		console.error("DB 연결 실패:", err);
		throw err;
	}
};

module.exports = { connectToDatabase, getDb: () => db };
