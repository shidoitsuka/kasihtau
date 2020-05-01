/*
  * This file is part of KasihTau Project which is released under MIT License.
  * See file LICENSE or go to https://github.com/shidoitsuka/kasihtau/blob/master/LICENSE for full license details.
*/

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const Enmap = require("enmap");
const db = new Enmap({ name: "db" });
const { host, port } = require("./config.js");

/*
 * since the database in enmap, "currentUser" key is required for auto increment
 * NoSQL for the go.
 */
if (typeof db.get("currentUser") != "number" || !db.has("currentUser"))
  db.set("currentUser", 0);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use("/assets", express.static("assets"));

// prevent GET favicon.ico error
app.get("/favicon.ico", (req, res) => res.status(204));

// get index
app.get("/", (req, res) => {
  res.status(200).render("index");
});

/*
 * development route
 * get "/db" to check database
 */
app.get("/db", (req, res) => {
  console.log(db);
  res.end();
});

/*
 * development route
 * get "/clean" to purge database
 */
app.get("/clean", (req, res) => {
  console.log(db.deleteAll());
  res.end();
});

/*
 * main process
 * triggered from index
 */
app.post("/process", (req, res) => {
  // increment "currentUser"
  db.set("currentUser", db.get("currentUser") + 1);

  // get userName from the front end (index.hbs)
  const { userName } = req.body;

  // get incremented currentUser
  const currentUser = db.get("currentUser");
  /*
   * set the incremented currentUser (as ID)
   * and insert "userName" as "name" and set messages as empty array
   * the final output would be :
   * newID: {
   *   name: userName,
   *   messages: [emptyArray]
   * }
   */
  db.set(`${currentUser}`, { name: userName, messages: [] });
  res.end();
});

// dynamic route to get user id
app.get("/:id", (req, res) => {
  // get the id from parameter
  const { id } = req.params;

  // find it in database. if undefined, end.
  if (db.get(id) == undefined) return res.end();

  // get name and messages from the database
  const { name, messages } = db.get(id);

  // temp variable
  let dataExisted;

  // check if there are any messages in "messages" from DB
  if (messages.length) dataExisted = true;
  // set "dataExisted" true if it does
  else dataExisted = false; // otherwise, false.

  // render "user.hbs" and apply variables so it can be processed in the front end
  res.status(200).render("user", { name, messages, dataExisted });
});

app.listen(port, host, console.log("site is up"));
