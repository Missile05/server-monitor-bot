import sendgrid from '@sendgrid/mail';
import { sendgridSettings } from '../../../config';

const { config } = sendgridSettings;
const { apiKey } = config;

sendgrid.setApiKey(apiKey);

export { sendgrid };