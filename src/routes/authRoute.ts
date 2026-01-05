import express, { Request, Response } from "express";
import "dotenv/config"
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router()
const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface BodyCreds {
    email: string,
    password: string
}

router.post("/signup", async (req: Request<{}, {}, BodyCreds>, res: Response) => {
    const { email, password } = req.body;

    try {
        const existingUser = await prisma.users.findUnique({
            where: {
                email: email
            }
        })

        console.log(existingUser);

        const hashedPassword = await bcrypt.hash(password, 10); 
        console.log(hashedPassword);

        if (!existingUser) {
            const user = await prisma.users.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    createdAt: new Date(),
                }
            })
            return res.json({
                message: "user created successfully",
            })
        }
        return res.status(400).json({ message: "user already exists" })
    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
})

router.post("/signin", async (req: Request<{}, {}, BodyCreds>, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: {
                email: email
            }
        })

        if (!user) {
            return res.status(400).json({ message: "invalid credentials" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "invalid credentials" })
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: "3h" });

        return res.json({ message: "login successful" ,
            token
        })
    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
})

export default router;