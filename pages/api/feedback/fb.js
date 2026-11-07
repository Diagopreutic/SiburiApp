import axios from "axios";

export default async function fb(req,res){


axios.post("https://colorvalue-e3832-default-rtdb.firebaseio.com/"+":feedback.json",{
    name:req.body.name,
    email:req.body.email,
    feedback:req.body.feedback
}).catch(err=>res.json({error:"error at backend"}))
    return res.json({done:"done"})
}