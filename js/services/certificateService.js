import { read, write } from './storageService.js';

const CERTIFICATE_STORAGE_KEY = 'certificates';

function getCertificates() {
    return read(CERTIFICATE_STORAGE_KEY, []);
}

function addCertificate(certificate) {
    const updated = [{ id: `${Date.now()}`, ...certificate }, ...getCertificates()];
    write(CERTIFICATE_STORAGE_KEY, updated);
    return updated;
}

export { getCertificates, addCertificate, CERTIFICATE_STORAGE_KEY };
export default { getCertificates, addCertificate, CERTIFICATE_STORAGE_KEY };