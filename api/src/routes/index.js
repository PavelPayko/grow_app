const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')
const pointsController = require('../controllers/pointsController')
const teamController = require('../controllers/teamController')
const competencyCatalogController = require('../controllers/competencyCatalogController')
const assessmentController = require('../controllers/assessmentController')
const competencyExcelController = require('../controllers/competencyExcelController')

const { verifyUserToken, isAdmin } = require('../middleware/auth')
const { requireCanAssess } = require('../middleware/canAssess')
const { upload } = require('../middleware/upload')

router.get('/createAdmin', userController.createAdmin)

router.get('/auth_me', verifyUserToken, authController.auth_me)
router.post('/login', authController.login)

router.get('/users', verifyUserToken, userController.getUsers)
router.post('/users', userController.createUser)
router.put('/users/:id', verifyUserToken, isAdmin, userController.updateUser)
router.delete('/users/:id', verifyUserToken, isAdmin, userController.deleteUser)
router.get('/users/:userId/points', verifyUserToken, pointsController.getUserPoints)

router.get('/teams', verifyUserToken, isAdmin, teamController.getTeams)
router.post('/teams', verifyUserToken, isAdmin, teamController.createTeam)

router.get('/teams/:teamId/catalog', verifyUserToken, competencyCatalogController.getTeamCatalog)
router.post('/teams/:teamId/catalogs', verifyUserToken, isAdmin, competencyCatalogController.createTeamCatalog)
router.post('/catalogs/clone', verifyUserToken, isAdmin, competencyCatalogController.cloneCatalog)

router.post('/catalogs/:catalogId/blocks', verifyUserToken, isAdmin, competencyCatalogController.createBlock)
router.put('/blocks/:id', verifyUserToken, isAdmin, competencyCatalogController.updateBlock)
router.delete('/blocks/:id', verifyUserToken, isAdmin, competencyCatalogController.deleteBlock)

router.post('/blocks/:blockId/domains', verifyUserToken, isAdmin, competencyCatalogController.createDomain)
router.put('/domains/:id', verifyUserToken, isAdmin, competencyCatalogController.updateDomain)
router.delete('/domains/:id', verifyUserToken, isAdmin, competencyCatalogController.deleteDomain)

router.post('/domains/:domainId/competencies', verifyUserToken, isAdmin, competencyCatalogController.createCompetency)
router.put('/competencies/:id', verifyUserToken, isAdmin, competencyCatalogController.updateCompetency)
router.delete('/competencies/:id', verifyUserToken, isAdmin, competencyCatalogController.deleteCompetency)

router.put('/blocks/:blockId/grade-targets', verifyUserToken, isAdmin, competencyCatalogController.upsertGradeTarget)
router.delete('/grade-targets/:id', verifyUserToken, isAdmin, competencyCatalogController.deleteGradeTarget)

router.get('/teams/:teamId/cycles', verifyUserToken, assessmentController.getTeamCycles)
router.get('/teams/:teamId/cycles/active', verifyUserToken, assessmentController.getActiveTeamCycle)
router.post('/teams/:teamId/cycles', verifyUserToken, isAdmin, assessmentController.createTeamCycle)

router.get('/cycles/:cycleId', verifyUserToken, assessmentController.getCycle)
router.post('/cycles/:cycleId/activate', verifyUserToken, isAdmin, assessmentController.activateCycle)
router.post('/cycles/:cycleId/close', verifyUserToken, isAdmin, assessmentController.closeCycle)
router.get('/cycles/:cycleId/aggregates', verifyUserToken, isAdmin, assessmentController.getTeamAggregates)

router.get('/cycles/:cycleId/users/:userId/assessments', verifyUserToken, assessmentController.getUserAssessments)
router.put('/cycles/:cycleId/users/:userId/assessments/:competencyId', verifyUserToken, requireCanAssess, assessmentController.upsertUserAssessment)
router.get('/cycles/:cycleId/users/:userId/aggregates', verifyUserToken, assessmentController.getUserAggregates)
router.get('/cycles/:cycleId/users/:userId/matrix', verifyUserToken, assessmentController.getUserMatrix)

router.get('/cycles/:cycleId/export', verifyUserToken, isAdmin, competencyExcelController.exportCycle)
router.post(
  '/cycles/:cycleId/import',
  verifyUserToken,
  isAdmin,
  upload.single('file'),
  competencyExcelController.importCycle
)

router.get('/points', verifyUserToken, pointsController.getPoints)
router.post('/points', verifyUserToken, pointsController.createPoint)
router.put('/points/:pointId', verifyUserToken, pointsController.updatePoint)

module.exports = router