import Opportunity from '../models/Opportunity.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendResponse from '../utils/sendResponse.js';

const ALLOWED_SORT_FIELDS = ['createdAt', 'estimatedValue', 'nextFollowUpDate', 'priority', 'customerName'];
const ALLOWED_FIELDS = [
  'customerName', 'contactName', 'contactEmail', 'contactPhone',
  'requirement', 'estimatedValue', 'stage', 'priority', 'nextFollowUpDate', 'notes',
];

const getOpportunities = asyncHandler(async (req, res) => {
  const { stage, priority, sortBy = 'createdAt', order = 'desc', search } = req.query;

  const filter = {};
  if (stage) filter.stage = stage;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { requirement: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
    ];
  }

  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;

  const opportunities = await Opportunity.find(filter)
    .populate('owner', 'name email')
    .sort({ [sortField]: sortOrder });

  const [aggResult] = await Opportunity.aggregate([
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        value: { $sum: '$estimatedValue' },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        totalPipelineValue: { $sum: '$value' },
        highPriority: { $sum: '$highPriority' },
        stages: { $push: { stage: '$_id', count: '$count', value: '$value' } },
      },
    },
  ])

  const byStage = {}
  ;['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'].forEach((s) => {
    byStage[s] = aggResult?.stages?.find((x) => x.stage === s)?.count || 0
  })

  const summary = {
    total: aggResult?.total || 0,
    totalPipelineValue: aggResult?.totalPipelineValue || 0,
    wonValue: aggResult?.stages?.find((x) => x.stage === 'Won')?.value || 0,
    highPriority: aggResult?.highPriority || 0,
    byStage,
  };

  sendResponse(res, 200, { opportunities, summary });
});

const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id).populate('owner', 'name email');
  if (!opportunity) return sendResponse(res, 404, { message: 'Opportunity not found.' });
  sendResponse(res, 200, { opportunity });
});

const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.create({
    owner: req.user._id,
    ...Object.fromEntries(ALLOWED_FIELDS.map((f) => [f, req.body[f]])),
  });
  await opportunity.populate('owner', 'name email');
  sendResponse(res, 201, { message: 'Opportunity created.', opportunity });
});

const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) return sendResponse(res, 404, { message: 'Opportunity not found.' });

  if (opportunity.owner.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, { message: 'Not authorized to update this opportunity.' });
  }

  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) opportunity[field] = req.body[field];
  });

  await opportunity.save();
  await opportunity.populate('owner', 'name email');
  sendResponse(res, 200, { message: 'Opportunity updated.', opportunity });
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) return sendResponse(res, 404, { message: 'Opportunity not found.' });

  if (opportunity.owner.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, { message: 'Not authorized to delete this opportunity.' });
  }

  await opportunity.deleteOne();
  sendResponse(res, 200, { message: 'Opportunity deleted.' });
});

export { getOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity };
