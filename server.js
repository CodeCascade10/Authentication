import app from "./src/app.js";
import connectDB from "./src/config/database.js";



connectDB()

app.listen(300,()=>{
  console.log("Server is listening on port 3000")
})