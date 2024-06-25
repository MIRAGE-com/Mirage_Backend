const express = require("express");
const cors = require("cors");
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.send("");
});

app.listen(8080, function () {
	console.log("http://localhost:8080/ 서버 실행중");
});
