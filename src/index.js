import NotifHandler from './notif-handler';
import ReadmeHandler from './readme-handler';
import incomingMiddleware from './incoming-middleware';
import Hull from './client';

Hull.NotifHandler = NotifHandler;
Hull.ReadmeHandler = ReadmeHandler;
Hull.incomingMiddleware = incomingMiddleware.bind(undefined, Hull);

module.exports = Hull;
