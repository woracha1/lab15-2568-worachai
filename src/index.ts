import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import morgan from "morgan";
import serverless from "serverless-http";

// import database
import { students } from "./db/db.js";
import { courses } from "./db/db.js";
import {
  zStudentDeleteBody,
  zStudentPostBody,
  zStudentPutBody,
  zStudentId
} from "./schemas/studentValidator.js";
import type { Student } from "./libs/types.js";
import type { Course } from "./libs/types.js";
import studentRouter from "./routes/studentRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import { error } from "console";

const app = express();
// ไม่ต้องใช้ app.listen()
// เพราะ Vercel จะจัดการการรันเซิร์ฟเวอร์ให้เองในรูปแบบของ Serverless Function

// morgan middlewares
app.use(morgan("dev"));

// middlewares
app.use(express.json());

app.use("/api/v2/", studentRouter);
app.use("/api/v2/", courseRouter);

// Endpoints
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "lab 15 API service successfully"
  });
});

app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express on Vercel!" });
});

app.get("/me", (req: Request, res: Response) => {
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

app.get("/students/:studentId/courses", (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId;

    const result = zStudentId.safeParse(studentId);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    const student = students.find((s) => s.studentId === studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student does not exist",
      });
    }

    if (!student.courses || student.courses.length === 0) {
      return res.json({
        success: true,
        message: `Student ${studentId} has no registered courses`,
        data: {
          studentId,
          courses: []
        },
      });
    }

    const enrolledCourses = courses
      .filter((c) => student.courses?.includes(c.courseId))
      .map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle
      }));

    res.set("Link", `/students/${studentId}/courses`);

    return res.json({
      success: true,
      message: `Get courses detail of student ${studentId}`,
      data: {
        studentId,
        courses: enrolledCourses,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

app.get("/api/v2/courses/:courseId", (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);

    if (isNaN(courseId)) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Invalid input: expected number, received NaN"
      });
    }

    const course = courses.find((c) => c.courseId === courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course does not found`,
      });
    }

    return res.json({
      success: true,
      message: `Get course detail of ${courseId}`,
      data: course,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

app.post("/api/v2/courses", (req: Request, res: Response) => {
  try {
    const body = req.body as Course;

    if (
      !body.courseId ||
      isNaN(body.courseId) ||
      body.courseId.toString().length !== 6 ||
      !body.courseTitle ||
      !Array.isArray(body.instructors) ||
      body.instructors.length === 0
    ) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Number must be exactly 6 digits"
      });
    }

    const exists = courses.find((c) => c.courseId === body.courseId);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Course ID already exists`,
      });
    }

    courses.push(body);

    return res.status(201).json({
      success: true,
      message: `Course ${body.courseId} has been added successfully`,
      data: body,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

app.put("/api/v2/courses", (req: Request, res: Response) => {
  try {
    const body = req.body as Course;

    if (
      !body.courseId ||
      isNaN(body.courseId) ||
      body.courseId.toString().length !== 6
    ) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "Number must be exactly 6 digits",
      });
    }

    const courseIndex = courses.findIndex((c) => c.courseId === body.courseId);

    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Course ID does not exists`,
      });
    }

    courses[courseIndex] = {
      ...courses[courseIndex],
      ...body,
    };

    return res.status(200).json({
      success: true,
      message: `Course ${body.courseId} has been updated successfully`,
      data: courses[courseIndex],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

app.delete("/api/v2/courses", (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;

    if (!courseId || isNaN(courseId) || courseId.toString().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "Number must be exactly 6 digits",
      });
    }

    const index = courses.findIndex((c) => c.courseId === courseId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Course Id does not exists`,
      });
    }

    const deletedCourse = courses.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: `Course ${courseId} has been deleted successfully`,
      data: deletedCourse[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
      error: err,
    });
  }
});

// สิ่งสำคัญที่ต้องทำคือ export default app
// แทนที่จะใช้ serverless(app) ซึ่งอาจไม่จำเป็น
export default app;