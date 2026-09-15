import fs from 'node:fs';

const path = 'apps/mobile/src/app/matrimony-profile.tsx';
let s = fs.readFileSync(path, 'utf8');

const queryOld = "  const { data: contactData, isFetching: contactLoading } = useGetProfileContactQuery(";
const queryNew = "  const { data: contactData, isFetching: contactLoading, isError: contactError } = useGetProfileContactQuery(";
if (!s.includes(queryOld)) throw new Error('contact query marker not found');
s = s.replace(queryOld, queryNew);

const contactOld = `          {contactLoading ? <ActivityIndicator color={C.green} size="small" /> : (\n            <View style={styles.contactDetails}>\n              {contactData?.contactPhone ? <Text style={styles.contactValue}>📞 {contactData.contactPhone}</Text> : null}\n              {contactData?.contactEmail ? <Text style={styles.contactValue}>✉️ {contactData.contactEmail}</Text> : null}\n              {!contactData?.contactPhone && !contactData?.contactEmail ? <Text style={styles.contactEmpty}>इस प्रोफाइल ने अभी संपर्क जानकारी नहीं जोड़ी है।</Text> : null}\n            </View>\n          )}`;
const contactNew = `          {contactLoading ? <ActivityIndicator color={C.green} size="small" /> : contactError ? (\n            <Text style={styles.contactEmpty}>संपर्क विवरण लोड नहीं हो पाया। कृपया प्रोफाइल दोबारा खोलें।</Text>\n          ) : (\n            <View style={styles.contactDetails}>\n              {contactData?.contactPhone ? <Text style={styles.contactValue}>📞 {contactData.contactPhone}</Text> : null}\n              {contactData?.contactEmail ? <Text style={styles.contactValue}>✉️ {contactData.contactEmail}</Text> : null}\n              {!contactData?.contactPhone && !contactData?.contactEmail ? <Text style={styles.contactEmpty}>इस प्रोफाइल ने अभी संपर्क जानकारी नहीं जोड़ी है।</Text> : null}\n            </View>\n          )}`;
if (!s.includes(contactOld)) throw new Error('contact display marker not found');
s = s.replace(contactOld, contactNew);

const privacyOld = `      <View style={styles.privacyNote}>\n        <SymbolView name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }} tintColor={C.green} size={20} />\n        <Text style={styles.privacyText}>संपर्क जानकारी निजी रहती है। आगे contact request flow के बाद ही दिखाई जाएगी।</Text>\n      </View>`;
const privacyNew = `      {!acceptedInterest ? (\n        <View style={styles.privacyNote}>\n          <SymbolView name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }} tintColor={C.green} size={20} />\n          <Text style={styles.privacyText}>संपर्क जानकारी निजी रहती है। रुचि स्वीकार होने के बाद ही दिखाई जाएगी।</Text>\n        </View>\n      ) : null}`;
if (!s.includes(privacyOld)) throw new Error('privacy note marker not found');
s = s.replace(privacyOld, privacyNew);

fs.writeFileSync(path, s);
