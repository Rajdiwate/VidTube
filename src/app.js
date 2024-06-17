import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser' //used for access and set cookies in users browser

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN, //which url can be allowed to access the below routes 
    credentials :true 
}));


app.use(express.json({limit: "20kb"})) //for form
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public")) //keeps static assets in a public folder
app.use(cookieParser())


export {app}