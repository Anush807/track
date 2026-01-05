import express, { Request, Response } from "express"
import "dotenv/config"
import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import authMiddleware from "../middlewares/authMiddleware"

const connectionString = `${process.env.DATABASE_URL}`

const router = express.Router();
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient( {adapter} )

interface todo{
    title: string,
    description: string
}

router.post("/create", authMiddleware, async (req: Request<{}, {}, todo>, res: Response) => {
    const { title, description } = req.body;
    const userId = await prisma.users.findUnique({
        where:{
            email: (req as any).user.email
        },
        select:{
            id: true
        }
    }).then(user => user?.id);

    console.log(userId)

    if(!userId){
        return res.status(404).json({ message: "user not found" })
    }

    console.log("User ID from token:", userId);

    const todo = await prisma.todos.create({
       data:{
        title,
        description,
        completed: false,
        userId: userId,
       }    
    })
    return res.json({
        message: "todo created successfully",
        todo
    })
})

router.get("/all", authMiddleware,  async (req: Request, res: Response) => {
    const todos =  await prisma.todos.findMany({
        where:{
            userId: (req as any).user.id
        }
    })
    return res.json({
        message: "todos fetched successfully",
        todos
    })
})

router.put("/toggle/:id", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingTodo = await prisma.todos.findUnique({
        where:{
            id: parseInt(id)
        }
    })

    if(!existingTodo){
        return res.status(404).json({ message: "todo not found" })
    }

    const todo = await prisma.todos.update({
        where:{
            id: parseInt(id)
        },
       data:{
        completed: !existingTodo.completed
       }    
    })
    return res.json({
        message: "todo toggled successfully",
        todo
    })
})  

router.delete("/delete/:id", authMiddleware, async (req: Request, res: Response) => {
   const { id } = req.params;

   if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid id" });
  }
    
   await prisma.todos.delete({
        where:{
            id: parseInt(id)
        }
    })
    return res.json({
        message: "todo deleted successfully"
    })
})

export default router;