export const metadata = { title: 'Account Deletion | Damodar Prayas' };

export default function AccountDeletionPage() {
  return <main style={{maxWidth:820,margin:'0 auto',padding:'48px 20px 80px',fontFamily:'system-ui,sans-serif',lineHeight:1.7,color:'#2f2522'}}>
    <p style={{color:'#9a6e42',fontWeight:800,letterSpacing:1.4,fontSize:12}}>DAMODAR PRAYAS</p>
    <h1 style={{color:'#65111d',fontSize:36,marginBottom:8}}>Account Deletion</h1>
    <p style={{color:'#766c67'}}>Request deletion of your Damodar Prayas account and associated personal data.</p>
    <section style={{background:'#fff8ed',border:'1px solid #eadcc8',borderRadius:16,padding:22,margin:'28px 0'}}>
      <h2 style={{marginTop:0,color:'#65111d'}}>If you can access the app</h2>
      <p>Open <b>Damodar Prayas → Profile → Account delete request</b>. Confirm the request. It will be sent to the administration for verification and processing.</p>
    </section>
    <h2>If you cannot access the app</h2>
    <p>You can still initiate deletion without reinstalling the app. Send an account-deletion request to the Damodar Prayas support contact published in the app/store listing. Include the mobile number registered with your Damodar Prayas account and write <b>“Account Deletion Request”</b> in your message. Do not send your password, OTP, Aadhaar number, or other sensitive credentials.</p>
    <p>The administration may contact you using your registered account details to verify ownership before processing the request. This protects accounts from unauthorized deletion.</p>
    <h2>What happens after approval?</h2>
    <p>Your Damodar Prayas login is removed, push-notification access is disabled, matrimony profiles linked to your account are removed from public availability, and applicable personal account information is deleted or anonymized. Content that must remain for legitimate security, fraud-prevention, dispute, or legal reasons may be retained only as necessary.</p>
    <h2>Matrimony profile deletion</h2>
    <p>Deleting only a matrimony profile is different from deleting your complete Damodar Prayas account. Matrimony profile deletion requests can be managed separately inside the app.</p>
    <h2>Privacy</h2>
    <p>For more information about how data is handled, read the <a href="/privacy-policy" style={{color:'#7a1723',fontWeight:700}}>Damodar Prayas Privacy Policy</a>.</p>
  </main>;
}
