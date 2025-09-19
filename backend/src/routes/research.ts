import { Router } from 'express';
import { ResearchController } from '../controllers/researchController';

const router = Router();

router.post('/', ResearchController.submitResearch);
router.get('/', ResearchController.getAllResearch);
router.get('/:id', ResearchController.getResearchById);

export default router;