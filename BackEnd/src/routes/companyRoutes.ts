import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../middlewares/validationMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import {
  createCompanySchema,
  createProjectSchema,
  updateCompanySchema,
  updateProjectSchema,
} from "../schemas/catalogSchemas";
import {
  companyRepository,
  projectRepository,
} from "../repositories/companyRepository";
import { triggerCatalogWebhook } from "../lib/catalogWebhook";

const companyRouter = Router();

companyRouter.get("/", async (_req, res) => {
  try {
    const companies = await companyRepository.findCatalog();
    return res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch companies" });
  }
});

companyRouter.get("/admin", adminMiddleware, async (_req, res) => {
  try {
    const companies = await companyRepository.findAllOwned();
    return res.json(companies);
  } catch (error) {
    console.error("Error fetching admin companies:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch companies" });
  }
});

companyRouter.post(
  "/",
  adminMiddleware,
  validate(createCompanySchema),
  async (req, res) => {
    try {
      const company = await companyRepository.create(req.body);
      await triggerCatalogWebhook({
        entity: "company",
        action: "created",
        data: company,
        actor: req.user,
      });
      return res.status(StatusCodes.CREATED).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to create company",
        details: error?.message || "Unknown error",
      });
    }
  },
);

companyRouter.patch(
  "/:id",
  adminMiddleware,
  validate(updateCompanySchema),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Company id is required" });
      }
      const company = await companyRepository.update(id, req.body);
      await triggerCatalogWebhook({
        entity: "company",
        action: "updated",
        data: company,
        actor: req.user,
      });
      return res.json(company);
    } catch (error: any) {
      console.error("Error updating company:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to update company",
        details: error?.message || "Unknown error",
      });
    }
  },
);

companyRouter.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Company id is required" });
    }
    const company = await companyRepository.deactivate(id);
    await triggerCatalogWebhook({
      entity: "company",
      action: "deleted",
      data: company,
      actor: req.user,
    });
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    console.error("Error deactivating company:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to remove company",
      details: error?.message || "Unknown error",
    });
  }
});

companyRouter.post(
  "/projects",
  adminMiddleware,
  validate(createProjectSchema),
  async (req, res) => {
    try {
      const project = await projectRepository.create(req.body);
      await triggerCatalogWebhook({
        entity: "project",
        action: "created",
        data: project,
        actor: req.user,
      });
      return res.status(StatusCodes.CREATED).json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to create project",
        details: error?.message || "Unknown error",
      });
    }
  },
);

companyRouter.patch(
  "/projects/:id",
  adminMiddleware,
  validate(updateProjectSchema),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Project id is required" });
      }
      const project = await projectRepository.update(id, req.body);
      await triggerCatalogWebhook({
        entity: "project",
        action: "updated",
        data: project,
        actor: req.user,
      });
      return res.json(project);
    } catch (error: any) {
      console.error("Error updating project:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to update project",
        details: error?.message || "Unknown error",
      });
    }
  },
);

companyRouter.delete("/projects/:id", adminMiddleware, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Project id is required" });
    }
    const project = await projectRepository.deactivate(id);
    await triggerCatalogWebhook({
      entity: "project",
      action: "deleted",
      data: project,
      actor: req.user,
    });
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    console.error("Error deactivating project:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to remove project",
      details: error?.message || "Unknown error",
    });
  }
});

export default companyRouter;
