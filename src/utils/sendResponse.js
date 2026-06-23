const sendResponse = (res, statusCode, data) => res.status(statusCode).json(data);

export default sendResponse;
