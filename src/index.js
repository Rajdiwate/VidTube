import connectDB from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({
    path: './env'
})

connectDB();








// //immediatly exexuting function
// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error" , (error)=>{
//             console.log( "APP not able to talk with DB" , error);
//             throw error;
//         })

//         app.listen(process.env.PORT , ()=>{
//             console.log("listening")
//         })
//     } catch (error) {
//         console.log(error)
//     }
// })()