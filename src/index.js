import NotifHandler from './notif-handler';
import ReadmeHandler from './readme-handler';
import IncomingMiddleware from './incoming-handler';
import Hull from './client';

Hull.NotifHandler = NotifHandler;
Hull.ReadmeHandler = ReadmeHandler;
Hull.IncomingMiddleware = IncomingMiddleware.bind(undefined, Hull);

module.exports = Hull;
