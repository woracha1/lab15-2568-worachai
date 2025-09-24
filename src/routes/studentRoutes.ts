import {Router, type Request, type Response } from "express";

import { students } from "../db/db.js";
import { courses } from "../db/db.js";
import {
  zStudentDeleteBody,
  zStudentPostBody,
  zStudentPutBody,
  zStudentId
} from "../schemas/studentValidator.js";
import type { Student } from "../libs/types.js";
import type { Course } from "../libs/types.js";

const router = Router();

router.get("/me", (req: Request, res: Response) => {
  try {
    const student = students.find(
      (s) => s.studentId === "670610728"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.json({
      success: true,
      data: student,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});


export default router;