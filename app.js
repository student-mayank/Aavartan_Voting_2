const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var path = require("path");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const nodemailer = require("nodemailer");
app.use(cookieParser());
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { decode } = require("punycode");
const { log } = require("console");

app.use(express.static("public"));
dotenv.config();
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.DBURL, { dbName: "voting_regitration_2" });

  console.log("connected to Database!!");
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rank1: {
    type: String,
  },
  rank2: {
    type: String,
  },
  rank3: {
    type: String,
  },
});
const teamSchema = {
  team_name: {
    type: String,
  },
  vote: {
    type: Number,
  },
};

const UserModel = mongoose.model("Data", UserSchema, "User_registration");
const TeamModel = mongoose.model("team", teamSchema, "team_vote");
server.listen(process.env.PORT, (err) => {
  if (err) {
    throw err;
  } else {
    console.log(`Server in running on port ${process.env.PORT}`);
  }
});

app.post("/login_user", async (req, res) => {
  const token = req.body.credential;
  if (!token) {
    return res.send("Unauthorized");
  }
  const decoded = jwt.decode(token);
  const Useremail = decoded.email;
  const Username = decoded.name;

  const present = await UserModel.findOne({ email: Useremail });
  console.log(decoded);
  if (!present) {
    res.sendFile(path.join(__dirname, "vote2.html"));

    const vote_entry = async (data) => {
      //for Rank one

      await TeamModel.findOne({ team_name: data.rank1 }).then(async (docs) => {
        var update1 = docs.vote + 100;
        await TeamModel.findOneAndUpdate(
          { team_name: data.rank1 },
          { vote: update1 }
        );
      });

      //for Rank two
      await TeamModel.findOne({ team_name: data.rank2 }).then(async (docs) => {
        var update2 = docs.vote + 50;
        await TeamModel.findOneAndUpdate(
          { team_name: data.rank2 },
          { vote: update2 }
        );
      });
      //for Rank three
      await TeamModel.findOne({ team_name: data.rank1 }).then(async (docs) => {
        var update3 = docs.vote + 30;
        await TeamModel.findOneAndUpdate(
          { team_name: data.rank3 },
          { vote: update3 }
        );
      });
      return console.log("vote added!");
    };

    const User_update = async (data) => {
      var obj = {
        rank1: data.rank1,
        rank2: data.rank2,
        rank3: data.rank3,
      };
      return await UserModel.findOneAndUpdate({ email: Useremail }, obj);
    };
    io.on("connection", (socket) => {
      console.log("connected to vote");
      socket.on("vote", async (vote_data) => {
        const user = new UserModel({ email: Useremail, name: Username });
        await user.save((err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(res);
            vote_entry(vote_data);
            User_update(vote_data);
          }
        });
      });
    });
  } else {
    return res.send("You Have already Voted!");
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "geolocation.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.post("/voted", (req, res) => {
  res.send("Thank You For Voting !");
});
