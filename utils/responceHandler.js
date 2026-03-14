export const responceHandler = ( res, statusCode , message , data=null, ...etc) => {
  return res.status( statusCode ).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    ...etc
  });
}