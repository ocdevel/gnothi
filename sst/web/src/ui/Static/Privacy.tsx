import React, {useEffect} from 'react'
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import { Section } from './Splash/Home/Utils';
import {styles} from "../Setup/Mui";
const {spacing, colors, sx} = styles
import Stack from '@mui/material/Stack';

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  return <Stack>
    <Section color="dark">
      <Stack
        sx={{
          display: "flex",
          direction: "column",
          alignItems: "center",
          justifyItems: "center",
        }}>
        <Typography
          variant="h1"
          maxWidth={500}
          sx={{
            textAlign: "center",
            color: colors.white,
            mt: { xs: 4, sm: 10 },
            mb: 2
            }}>
          Privacy Policy
        </Typography>
      </Stack>
      </Section>
    <AsHtml/>
  </Stack>
}

function AsHtml() {
  return <Box
    sx={{
      marginX: 25,
      marginY: 5,

    }}>
  <>

    <p> <strong><em>Last modified: September 26, 2020</em></strong> </p>
    <p className="c0 c4"><span className="c3"></span></p>
    <p className="c0"><span className="c3">This Privacy Policy describes Our policies and procedures on the collection, use and
      disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law
      protects You.</span></p>
    <p className="c0 c4"><span className="c3"></span></p>
    <p className="c0"><span className="c3">We use Your Personal data to provide and improve the Service. By using the Service, You
      agree to the collection and use of information in accordance with this Privacy Policy.</span></p>
    <p className="c0 c4"><span className="c3"></span></p>
    <p> <h1>Summary of Key Points</h1> </p>
    <hr/>
      <p className="c0 c4"><span className="c19 c10"></span></p>
      <p><strong>What personal information do we process?</strong> When you visit, use,
      or navigate our Services, we may process personal information depending on how you interact with The Site and the
      Services, the choices you make, and the products and features you use.</p>
      <p><strong>Do we process any sensitive personal information? </strong> We may
      process sensitive personal information, when necessary, with your consent or as otherwise permitted by applicable
      law.</p>
      <p><strong>Collection from Third Parties:</strong> We may collect information
      about you from Third parties, including from any account through which you log into, or otherwise interact with
      proxies (e.g., Facebook or Google). If applicable, we may
      have access to certain information from your linked Google or Facebook account, including your public profile
      information, your email address, or other information possessed by those Third parties. We may aggregate any
      information about you collected from any source. When you create an account on the Services you may be able to do
      so by using your credentials with a designated Third-party website or service (&quot;Third Party Account&quot;)
      such as Gmail. Doing so will enable you to link your account and your Third-Party Account. If you choose this
      option, a Third-Party Account pop-up box will appear that you will need to approve to proceed, and which will
      describe the types of information that we will obtain. This information includes your Personal Information stored
      on your Third-Party Account, such as username, email address, profile picture, birthday, gender and preferences.
      Any Anonymous Information that is specifically connected or linked to any Personal Information, is treated by us
      as Personal Information, if such connection or linkage exists.</p>
      <p><strong>Registering through social network account:</strong> When you register
      or sign-in to the Services via your social network account (e.g., Facebook, Google+), we will have access to basic
      information from your social network account, such as your full name, home address, email address, birthdate,
      profile picture, as well as any other information you made publicly available on such account or agreed to share
      with us. At all times, we will abide by the terms, conditions and restrictions of the social network
      platform.<span className="c19 c10">&nbsp;</span></p>
      <p><strong>How do you process my information?</strong> We process your
      information to provide, improve, and administer our Services, communicate with you, for security and fraud
      prevention, and to comply with law. We may also process your information for other purposes with your consent. We
      process your information only when we have a valid legal reason to do so.</p>
      <p><strong>How do we keep your information safe?</strong> We have organizational
      and technical processes and procedures in place to protect your personal information. However, no electronic
      transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot
      promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat
      our security and improperly collect, access, steal, or modify your information.</p>
      <p><strong>What are your rights?</strong> Depending on where you are located
      geographically, the applicable privacy law may mean you have certain rights regarding your personal
      information.</p>
      <p className="c0 c4"><span className="c3"></span></p>
    <p><h1>Interpretation and Definitions</h1></p>
      <hr/>
        <p className="c0 c4"><span className="c5"></span></p>
        <p className="c0 c4"><span className="c5"></span></p>
        <p><h2>Interpretation</h2></p>
        <p className="c0"><span className="c3">The words of which the initial letter is capitalized have meanings defined under the
      following conditions. The following definitions shall have the same meaning regardless of whether they appear in
      singular or in plural.</span></p>
        <p className="c0 c4"><span className="c3"></span></p>
        <p><h2>Definitions</h2></p>
        <p className="c0"><span className="c3">For the purposes of this Privacy Policy:</span></p>
        <p className="c0 c4"><span className="c3"></span></p>
        <ul>
          <li><strong>Account</strong> means a unique account
        created for You to access our Service or parts of our Service.</li>
          <li><strong>Affiliate</strong> means an entity that
        controls, is controlled by or is under common control with a party, where &quot;control&quot; means ownership of
        50% or more of the shares, equity interest or other securities entitled to vote for election of directors or
        other managing authority.</li>
          <li><strong>Application</strong> means the software program
        provided by the Company downloaded by You on any electronic device, named Gnothi</li>
          <li><strong>Business</strong>, for the purpose of the CCPA
        (California Consumer Privacy Act), refers to the Company as the legal entity that collects Consumers&#39;
            personal information and determines the purposes and means of the processing of Consumers&#39; personal
        information, or on behalf of which such information is collected and that alone, or jointly with others,
        determines the purposes and means of the processing of consumers&#39; personal information, that does business
        in the State of California.</li>
          <li><strong>Company</strong> (referred to as either
            &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to OCDevel
        LLC and/or Gnothi,108 West 13th Street, Wilmington, Delaware 19801</li>
          <li><strong>Consumer</strong>, for the purpose of the CCPA
        (California Consumer Privacy Act), means a natural person who is a California resident. A resident, as defined
        in the law, includes (1) every individual who is in the USA for other than a temporary or transitory purpose,
        and (2) every individual who is domiciled in the USA who is outside the USA for a temporary or transitory
        purpose.</li>
          <li><strong>Cookies</strong> are small files that are
        placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing
        history on that website among its many uses.</li>
          <li><strong>Country</strong> refers to: Oregon, United
        States.</li>
          <li><strong>Data Controller</strong>, for the purposes of the
        GDPR (General Data Protection Regulation), refers to the Company as the legal person which alone or jointly with
        others determines the purposes and means of the processing of Personal Data.</li>
          <li><strong>Device</strong> means any device that can
        access the Service such as a computer, a cell phone or a digital tablet.</li>
          <li><strong>Do Not Track (DNT)</strong> is a concept that
        has been promoted by US regulatory authorities, in particular the U.S. Federal Trade Commission (FTC), for the
        Internet industry to develop and implement a mechanism for allowing internet users to control the tracking of
        their online activities across websites.</li>
          <li className="c0 c12 li-bullet-0"><strong>Personal Data</strong><span className="c3">&nbsp;is any information that
        relates to an identified or identifiable individual. </span></li>
        <li>For the purposes of the GDPR, Personal Data means any information relating to You
      such as a name, an identification number, location data, online identifier or to one or more factors specific to
      the physical, physiological, genetic, mental, economic, cultural or social identity.</li>
        <li>For the purposes of the CCPA, Personal Data means any information that identifies,
      relates to, describes or is capable of being associated with, or could reasonably be linked, directly or
      indirectly, with You.</li>
          <li className="c0 c12 li-bullet-0"><strong>Sale</strong><span className="c3">, for the purpose of the CCPA
        (California Consumer Privacy Act), means selling, renting, releasing, disclosing, disseminating, making
        available, transferring, or otherwise communicating orally, in writing, or by electronic or other means, a
        Consumer&#39;s Personal information to another business or a third party for monetary or other valuable
        consideration.</span></li>
          <li className="c0 c12 li-bullet-0"><strong>Service</strong><span className="c3">&nbsp;refers to the Application or
        the Website or both.</span></li>
          <li className="c0 c12 li-bullet-0"><strong>Service Provider</strong><span
            className="c3">&nbsp;means any natural or
        legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals
        employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform
        services related to the Service or to assist the Company in analyzing how the Service is used. For the purpose
        of the GDPR, Service Providers are considered Data Processors.</span></li>
          <li className="c0 c12 li-bullet-0"><strong>Third-party Social Media Service</strong><span
            className="c3">&nbsp;refers to any website or any social network website through which a User can log in or create
        an account to use the Service.</span></li>
          <li className="c0 c12 li-bullet-0"><strong>Usage Data</strong><span className="c3">&nbsp;refers to data collected
        automatically, either generated by the use of the Service or from the Service infrastructure itself (for
        example, the duration of a page visit).</span></li>
          <li className="c0 c12 li-bullet-0"><strong>Website</strong><span className="c7">&nbsp;refers to Gnothi, accessible
        from </span><span className="c17 c7"><a className="c23"
                                                href="https://www.google.com/url?q=https://gnothiai.com&amp;sa=D&amp;source=editors&amp;ust=1682120128973461&amp;usg=AOvVaw2p872Oo-pGYXNcv-B-A6UW" target="_blank">https://gnothiai.com</a></span><span
            className="c3">&nbsp;</span></li>
          <li className="c0 c12 li-bullet-0"><strong>You</strong><span className="c7">&nbsp;</span><span
            className="c7">means</span><span className="c3">&nbsp;the individual accessing or using the Service, or the company, or
        other legal entity on behalf of which such individual is accessing or using the Service, as applicable. Under
        GDPR (General Data Protection Regulation), You can be referred to as the Data Subject or as the User as you are
        the individual using the Service.</span></li>
        </ul>
        <p className="c0 c15 c4"><span className="c3"></span></p>
        <p className="c0 c4"><span className="c3"></span></p>
        <p><h1>Collecting and Using Your Personal Data</h1></p>
        <hr/>
          <p className="c0 c4"><span className="c5"></span></p>
          <p className="c0 c4"><span className="c5"></span></p>
          <p><h2>Types of Data Collected</h2></p>
          <p className="c0 c4"><span className="c19 c29"></span></p>
          <p><h3>Personal Data</h3></p>
          <p className="c0"><span className="c3">While using Our Service, We may ask You to provide Us with certain personally
      identifiable information that can be used to contact or identify You. Personally identifiable information may
      include, but is not limited to:</span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <ul className="c13 lst-kix_da1yjgv0fu26-0 start">
            <li className="c0 c12 li-bullet-0"><span className="c3">Email address</span></li>
            <li className="c0 c12 li-bullet-0"><span className="c3">First name and last name</span></li>
            <li className="c0 c12 li-bullet-0"><span className="c3">Phone number</span></li>
            <li className="c0 c12 li-bullet-0"><span
              className="c3">Address, State, Province, ZIP/Postal Code, City</span></li>
            <li className="c0 c12 li-bullet-0"><span className="c3">Usage Data</span></li>
          </ul>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><h3>Usage Data</h3></p>
          <p className="c0"><span className="c3">Usage Data is collected automatically when using the Service.</span>
          </p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0"><span className="c3">Usage Data may include information such as Your Device&#39;s Internet Protocol address
      (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of
      Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0"><span className="c3">When You access the Service by or through a mobile device, We may collect certain
      information automatically, including, but not limited to, the type of mobile device You use, Your mobile device
      unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser
      You use, unique device identifiers and other diagnostic data.</span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0"><span className="c3">We may also collect information that Your browser sends whenever You visit our Service
      or when You access the Service by or through a mobile device.</span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><h3>Tracking Technologies and Cookies</h3></p>
          <p className="c0"><span className="c3">We use Cookies and similar tracking technologies to track the activity on Our Service
      and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track
      information and to improve and analyze Our Service.</span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0"><span className="c3">You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is
      being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service.</span>
          </p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0"><span className="c3">Cookies can be &quot;Persistent&quot; or &quot;Session&quot; Cookies. Persistent
      Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted
      as soon as You close your web browser. Learn more about cookies: All About Cookies.</span></p>
          <p className="c0"><span className="c3">We use both session and persistent Cookies for the purposes set out below:</span>
          </p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><strong>Necessary / Essential Cookies</strong></p>
          <ul className="c13 lst-kix_byslucgvvhg1-0 start">
            <li className="c0 c6 li-bullet-0"><span className="c3">Type: Session Cookies</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Administered by: Us</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Purpose: These Cookies are essential to provide You with services
        available through the Website and to enable You to use some of its features. They help to authenticate users and
        prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be
        provided, and We only use these Cookies to provide You with those services.</span></li>
          </ul>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><strong>Cookies Policy / Notice Acceptance Cookies</strong></p>
          <ul className="c13 lst-kix_1g2qx0r5deui-0 start">
            <li className="c0 c6 li-bullet-0"><span className="c3">Type: Persistent Cookies</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Administered by: Us</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Purpose: These Cookies identify if users have accepted the use of
        cookies on the Website.</span></li>
          </ul>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><strong>Functionality Cookies</strong></p>
          <ul className="c13 lst-kix_ov7epolnuv4-0 start">
            <li className="c0 c6 li-bullet-0"><span className="c3">Type: Persistent Cookies</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Administered by: Us</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Purpose: These Cookies allow us to remember choices You make when You
        use the Website, such as remembering your login details or language preference. The purpose of these Cookies is
        to provide You with a more personal experience and to avoid You having to re-enter your preferences every time
        You use the Website. </span></li>
          </ul>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><strong>Tracking and Performance Cookies</strong></p>
          <ul className="c13 lst-kix_p9952ygdbiul-0 start">
            <li className="c0 c6 li-bullet-0"><span className="c3">Type: Persistent Cookies</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Administered by: Third-Parties</span></li>
            <li className="c0 c6 li-bullet-0"><span className="c3">Purpose: These Cookies are used to track information about traffic to
        the Website and how users use the Website. The information gathered via these Cookies may directly or indirectly
        identify you as an individual visitor. This is because the information collected is typically linked to a
        pseudonymous identifier associated with the device you use to access the Website. We may also use these Cookies
        to test new pages, features or new functionality of the Website to see how our users react to them.</span></li>
          </ul>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p className="c0 c4"><span className="c3"></span></p>
          <p><h1>Use of Your Personal Data</h1></p>
          <hr/>
            <p className="c0 c4"><span className="c5"></span></p>
            <p className="c0 c4"><span className="c5"></span></p>
            <p className="c0"><span className="c3">The Company may use Personal Data for the following purposes:</span>
            </p>
            <ul className="c13 lst-kix_jg7zkly4yytk-0 start">
              <li className="c0 c12 li-bullet-0"><span className="c3">To provide and maintain our Service, including to monitor the usage
        of our Service.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">To manage Your Account: to manage Your registration as a user of the
        Service. The Personal Data You provide can give You access to different functionalities of the Service that are
        available to You as a registered user.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">For the performance of a contract: the development, compliance and
        undertaking of the purchase contract for the products, items or services You have purchased or of any other
        contract with Us through the Service.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">To contact You: To contact You by email, telephone calls, SMS, or
        other equivalent forms of electronic communication, such as a mobile application&#39;s push notifications
        regarding updates or informative communications related to the functionalities, products or contracted services,
        including the security updates, when necessary or reasonable for their implementation.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">To provide You with news, special offers and general information
        about other goods, services and events which we offer that are similar to those that you have already purchased
        or enquired about unless You have opted not to receive such information.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">To manage Your requests: To attend and manage Your requests to
        Us.</span></li>
            </ul>
            <p className="c0 c4 c15"><span className="c3"></span></p>
            <p className="c0"><span
              className="c3">We may share your personal information in the following situations:</span></p>
            <ul className="c13 lst-kix_jia7nx4o4ssg-0 start">
              <li className="c0 c12 li-bullet-0"><span className="c3">With Service Providers: We may share Your personal information with
        Service Providers to monitor and analyze the use of our Service, for payment processing, to contact You.</span>
              </li>
              <li className="c0 c12 li-bullet-0"><span className="c3">For Business transfers: We may share or transfer Your personal
        information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or
        acquisition of all or a portion of our business to another company.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">With Business partners: We may share Your information with Our
        business partners to offer You certain products, services or promotions.</span></li>
              <li className="c0 c12 li-bullet-0"><span className="c3">With other users: when You share personal information or otherwise
        interact in the public areas with other users, such information may be viewed by all users and may be publicly
        distributed outside. If You interact with other users or register through a Third-Party Social Media Service,
        Your contacts on the Third-Party Social Media Service may see Your name, profile, pictures and description of
        Your activity. Similarly, other users will be able to view descriptions of Your activity, communicate with You
        and view Your profile.</span></li>
            </ul>
            <p className="c0 c15 c4"><span className="c3"></span></p>
            <p className="c0 c15 c4"><span className="c3"></span></p>
            <p><h1>Retention of Your Personal Data</h1></p>
            <hr/>
              <p className="c0 c4"><span className="c5"></span></p>
              <p className="c0 c4"><span className="c5"></span></p>
              <p className="c0"><span className="c3">The Company will only retain Your Personal Data for as long as is necessary for the
      purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to
      comply with our legal obligations (for example, if we are required to retain your data to comply with applicable
      laws), resolve disputes, and enforce our legal agreements and policies.</span></p>
              <p className="c0 c4"><span className="c3"></span></p>
              <p className="c0"><span className="c3">The Company will also retain Usage Data for internal analysis purposes. Usage Data is
      generally retained for a shorter period of time, except when this data is used to strengthen the security or to
      improve the functionality of Our Service, or We are legally obligated to retain this data for longer time
      periods.</span></p>
              <p className="c0 c4"><span className="c3"></span></p>
              <p className="c0 c4"><span className="c3"></span></p>
              <p><h1>Transfer of Your Personal Data</h1></p>
              <hr/>
                <p className="c0 c4"><span className="c5"></span></p>
                <p className="c0 c4"><span className="c5"></span></p>
                <p className="c0"><span className="c3">Your information, including Personal Data, is processed at the Company&#39;s operating
      offices and in any other places where the parties involved in the processing are located. It means that this
      information may be transferred to &mdash; and maintained on &mdash; computers located outside of Your state,
      province, country or other governmental jurisdiction where the data protection laws may differ than those from
      Your jurisdiction.</span></p>
                <p className="c0 c4"><span className="c3"></span></p>
                <p className="c0"><span className="c3">Your consent to this Privacy Policy followed by Your submission of such information
      represents Your agreement to that transfer.</span></p>
                <p className="c0 c4"><span className="c3"></span></p>
                <p className="c0"><span className="c3">The Company will take all steps reasonably necessary to ensure that Your data is
      treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place
      to an organization or a country unless there are adequate controls in place including the security of Your data
      and other personal information.</span></p>
                <p className="c0 c4"><span className="c3"></span></p>
                <p className="c0 c4"><span className="c3"></span></p>
                <p><h1>Disclosure of Your Personal Data</h1></p>
                <hr/>
                  <p className="c0 c4"><span className="c5"></span></p>
                  <p className="c0 c4"><span className="c5"></span></p>
                  <p><h2>Business Transactions</h2></p>
                  <p className="c0"><span className="c3">If the Company is involved in a merger, acquisition or asset sale, Your Personal Data
      may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a
      different Privacy Policy.</span></p>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <p><h2>Law enforcement</h2></p>
                  <p className="c0"><span className="c3">Under certain circumstances, the Company may be required to disclose Your Personal Data
      if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government
      agency).</span></p>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <p><h2>Other legal requirements</h2></p>
                  <p className="c0"><span className="c3">The Company may disclose Your Personal Data in the good faith belief that such action
      is necessary to:</span></p>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <ul className="c13 lst-kix_2dghst26axd6-0 start">
                    <li className="c0 c12 li-bullet-0"><span className="c3">Comply with a legal obligation</span></li>
                    <li className="c0 c12 li-bullet-0"><span className="c3">Protect and defend the rights or property of the Company</span>
                    </li>
                    <li className="c0 c12 li-bullet-0"><span className="c3">Prevent or investigate possible wrongdoing in connection with the
        Service</span></li>
                    <li className="c0 c12 li-bullet-0"><span className="c3">Protect the personal safety of Users of the Service or the
        public</span></li>
                    <li className="c0 c12 li-bullet-0"><span className="c3">Protect against legal liability</span></li>
                  </ul>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <p><h2>Security of Your Personal Data</h2></p>
                  <p className="c0"><span className="c3">The security of Your Personal Data is important to Us, but remember that no method of
      transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use
      commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</span></p>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <p className="c0 c4"><span className="c3"></span></p>
                  <p><h1>Subprocessors</h1></p>
                  <hr/>
                    <p className="c0 c4"><span className="c5"></span></p>
                    <p className="c11"><span className="c7 c21">A sub-processor is a third-party data processor that we have hired and who has
      access to or processes Customer Content that contains personal data. This includes our employees. </span></p>
                    <p className="c11"><span className="c21 c7">We review the security, privacy, and confidentiality policies of potential
      sub-processors before entering into Data Protection Agreements with each of them that will or may access or
      otherwise process Customer Content. We refresh the list of used sub-processors and notify users of new
      sub-processors. </span></p>
                    <p className="c11"><span className="c21 c7">This advice is not intended to be a binding contract and does not grant customers
      any additional rights or remedies. The information presented here is simply intended to demonstrate how we engage
      sub-processors and to provide a list of the actual third-party sub-processors that we use.</span></p>
                    <p className="c0 c4"><span className="c5"></span></p><a
                    id="t.d457059e0df605c4c7b56f96a380da24fb883553"></a><a id="t.0"></a>
                    <table className="c20">
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p><strong>Entity Name</strong></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p><strong>Purpose</strong></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p><strong>Entity Country</strong></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Amazon Web Services</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Various tools</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">&nbsp;US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Open AI</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">AI content generation</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Stripe</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Billing services</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Apple Store</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Billing services</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Google Play</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Billing services</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Paypal</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Billing services</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Twilio</span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Communication tool</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Google </span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Analytics, insights</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                      <tr className="c2">
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Plaid </span></p>
                        </td>
                        <td className="c8" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">Payment Processor</span></p>
                        </td>
                        <td className="c14" colSpan="1" rowSpan="1">
                          <p className="c9"><span className="c5">US</span></p>
                        </td>
                      </tr>
                    </table>
                    <p className="c0 c4"><span className="c5"></span></p>
                    <p className="c0 c4"><span className="c5"></span></p>
                    <p className="c0"><span className="c3">Service Providers have access to Your Personal Data only to perform their tasks on Our
      behalf and are obligated not to disclose or use it for any other purpose.</span></p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h2>Analytics</h2></p>
                    <p className="c0"><span className="c3">We may use third-party Service providers to monitor and analyze the use of our
      Service.</span></p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h3>Google Analytics</h3></p>
                    <ul className="c13 lst-kix_1y8l3zvx47ud-0 start">
                      <li className="c0 c6 li-bullet-0"><span className="c3">Google Analytics is a web analytics service offered by Google that
        tracks and reports website traffic. Google uses the data collected to track and monitor the use of our Service.
        This data is shared with other Google services. Google may use the collected data to contextualize and
        personalize the ads of its own advertising network.</span></li>
                      <li className="c0 c6 li-bullet-0"><span className="c3">You can opt-out of having made your activity on the Service available
        to Google Analytics by installing the Google Analytics opt-out browser add-on. The add-on prevents the Google
        Analytics JavaScript (ga.js, analytics.js and dc.js) from sharing information with Google Analytics about visits
        activity.</span></li>
                      <li className="c0 c6 li-bullet-0"><span className="c7">You may opt-out of certain Google Analytics features through your
        mobile device settings, such as your device advertising settings or by following the instructions provided by
        Google in their Privacy Policy: </span><span className="c17 c7"><a className="c23"
                                                                           href="https://www.google.com/url?q=https://policies.google.com/privacy&amp;sa=D&amp;source=editors&amp;ust=1682120128993173&amp;usg=AOvVaw1777GODHT0jkgZW8k1xyec" target="_blank">https://policies.google.com/privacy</a></span><span
                        className="c3">&nbsp;</span></li>
                      <li className="c0 c6 li-bullet-0"><span className="c7">For more information on the privacy practices of Google, please visit
        the Google Privacy &amp; Terms web page: </span><span className="c7 c17"><a className="c23"
                                                                                    href="https://www.google.com/url?q=https://policies.google.com/privacy&amp;sa=D&amp;source=editors&amp;ust=1682120128993502&amp;usg=AOvVaw1NPGEjvNwvcbIKA993LKej" target="_blank">https://policies.google.com/privacy</a></span><span
                        className="c3">&nbsp;</span></li>
                    </ul>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h2>Email Marketing</h2></p>
                    <p className="c0"><span className="c3">We may use Your Personal Data to contact You with newsletters, marketing or promotional
      materials and other information that may be of interest to You. You may opt-out of receiving any, or all, of these
      communications from Us by following the unsubscribe link or instructions provided in any email We send or by
      contacting Us.</span></p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p className="c0"><span className="c3">We may use Email Marketing Service Providers to manage and send emails to You.</span>
                    </p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h3>Amazon Workmail</h3></p>
                    <ul className="c13 lst-kix_872lymmxzxa8-0 start">
                      <li className="c0 c6 li-bullet-0"><span
                        className="c7">Their Privacy Policy can be viewed at </span><span className="c17 c7"><a
                        className="c23"
                        href="https://www.google.com/url?q=https://aws.amazon.com/workmail&amp;sa=D&amp;source=editors&amp;ust=1682120128994383&amp;usg=AOvVaw1RYlaF3LuyFi4F7AOaNVeX" target="_blank">https://aws.amazon.com/workmail</a></span><span
                        className="c3">&nbsp;</span></li>
                    </ul>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h2>Payments</h2></p>
                    <p className="c0"><span className="c3">We may provide paid products and/or services within the Service. In that case, we may
      use third-party services for payment processing (e.g. payment processors).</span></p>
                    <p className="c0"><span className="c3">We will not store or collect Your payment card details. That information is provided
      directly to Our third-party payment processors whose use of Your personal information is governed by their Privacy
      Policy. These payment processors adhere to the standards set by PCI-DSS as managed by the PCI Security Standards
      Council, which is a joint effort of brands like Visa, Mastercard, American Express and Discover. PCI-DSS
      requirements help ensure the secure handling of payment information.</span></p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h3>Stripe</h3></p>
                    <ul className="c13 lst-kix_6kr4fj5r6gtf-0 start">
                      <li className="c0 c6 li-bullet-0"><span
                        className="c7">Their Privacy Policy can be viewed at </span><span className="c17 c7"><a
                        className="c23"
                        href="https://www.google.com/url?q=https://stripe.com/us/privacy&amp;sa=D&amp;source=editors&amp;ust=1682120128995151&amp;usg=AOvVaw0pvydB3k_iu7zHOSlYXsri" target="_blank">https://stripe.com/us/privacy</a></span><span
                        className="c3">&nbsp;</span></li>
                    </ul>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p className="c0 c4"><span className="c3"></span></p>
                    <p><h1>GDPR Privacy</h1></p>
                    <hr/>
                      <p className="c0 c4"><span className="c5"></span></p>
                      <p className="c0 c4"><span className="c5"></span></p>
                      <p><h2>Legal Basis for Processing Personal Data under GDPR</h2>
                      </p>
                      <p className="c0"><span className="c3">We may process Personal Data under the following conditions:</span>
                      </p>
                      <ul className="c13 lst-kix_4w3i7ex3e6ud-0 start">
                        <li className="c0 c12 li-bullet-0"><span className="c3">Consent: You have given Your consent for processing Personal Data
        for one or more specific purposes.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Performance of a contract: Provision of Personal Data is necessary
        for the performance of an agreement with You and/or for any pre-contractual obligations thereof.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Legal obligations: Processing Personal Data is necessary for
        compliance with a legal obligation to which the Company is subject.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Vital interests: Processing Personal Data is necessary in order to
        protect Your vital interests or of another natural person.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Public interests: Processing Personal Data is related to a task that
        is carried out in the public interest or in the exercise of official authority vested in the Company.</span>
                        </li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Legitimate interests: Processing Personal Data is necessary for the
        purposes of the legitimate interests pursued by the Company.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">In any case, the Company will gladly help to clarify the specific
        legal basis that applies to the processing, and in particular whether the provision of Personal Data is a
        statutory or contractual requirement, or a requirement necessary to enter into a contract.</span></li>
                      </ul>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p><h2>Your Rights under the GDPR</h2></p>
                      <p className="c0"><span className="c3">The Company undertakes to respect the confidentiality of Your Personal Data and to
      guarantee You can exercise Your rights.</span></p>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p className="c0"><span className="c3">You have the right under this Privacy Policy, and by law if You are within the EU,
      to:</span></p>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <ul className="c13 lst-kix_p6534bmjfyny-0 start">
                        <li className="c0 c12 li-bullet-0"><span className="c3">Request access to Your Personal Data. The right to access, update or
        delete the information We have on You. Whenever made possible, you can access, update or request deletion of
        Your Personal Data directly within Your account settings section. If you are unable to perform these actions
        yourself, please contact Us to assist You. This also enables You to receive a copy of the Personal Data We hold
        about You.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c7">Request correction of the Personal Data that We hold about You. You
        have the </span><span className="c7">right to</span><span className="c3">&nbsp;have any incomplete or inaccurate
        information We hold about You corrected.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Object to processing of Your Personal Data. This right exists where
        We are relying on a legitimate interest as the legal basis for Our processing and there is something about Your
        particular situation, which makes You want to object to our processing of Your Personal Data on this ground. You
        also have the right to object where We are processing Your Personal Data for direct marketing purposes.</span>
                        </li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Request erasure of Your Personal Data. You have the right to ask Us
        to delete or remove Personal Data when there is no good reason for Us to continue processing it.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Request the transfer of Your Personal Data. We will provide to You,
        or to a third-party You have chosen, Your Personal Data in a structured, commonly used, machine-readable format.
        Please note that this right only applies to automated information which You initially provided consent for Us to
        use or where We used the information to perform a contract with You.</span></li>
                        <li className="c0 c12 li-bullet-0"><span className="c3">Withdraw Your consent. You have the right to withdraw Your consent
        on using your Personal Data. If You withdraw Your consent, We may not be able to provide You with access to
        certain specific functionalities of the Service.</span></li>
                      </ul>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p><h2>Exercising of Your GDPR Data Protection Rights</h2></p>
                      <p className="c0"><span className="c3">You may exercise Your rights of access, rectification, cancellation and opposition by
      contacting Us. Please note that we may ask You to verify Your identity before responding to such requests. If You
      make a request, We will try our best to respond to You as soon as possible.</span></p>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p className="c0"><span className="c3">You have the right to complain to a Data Protection Authority about Our collection and
      use of Your Personal Data. For more information, if You are in the European Economic Area (EEA), please contact
      Your local data protection authority in the EEA.</span></p>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p className="c0 c4"><span className="c3"></span></p>
                      <p><h1>CCPA Privacy</h1></p>
                      <hr/>
                        <p className="c0 c4"><span className="c5"></span></p>
                        <p className="c0 c4"><span className="c5"></span></p>
                        <p><h2>Your Rights under the CCPA</h2></p>
                        <p className="c0"><span className="c3">Under this Privacy Policy, and by law if You are a resident of California, You have the
      following rights:</span></p>
                        <p className="c0 c4"><span className="c3"></span></p>
                        <ul className="c13 lst-kix_bcezjntvopjy-0 start">
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right to notice. You must be properly notified which categories
        of Personal Data are being collected and the purposes for which the Personal Data is being used.</span></li>
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right to access / the right to request. The CCPA permits You to
        request and obtain from the Company information regarding the disclosure of Your Personal Data that has been
        collected in the past 12 months by the Company or its subsidiaries to a third-party for the third party&#39;s
        direct marketing purposes.</span></li>
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right to say no to the sale of Personal Data. You also have the
        right to ask the Company not to sell Your Personal Data to third parties. You can submit such a request by
        visiting our &quot;Do Not Sell My Personal Information&quot; section or web page.</span></li>
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right to know about Your Personal Data. You have the right to
        request and obtain from the Company information regarding the disclosure of the following:</span></li>
                        </ul>
                        <ul className="c13 lst-kix_bcezjntvopjy-1 start">
                          <li className="c0 c6 li-bullet-0"><span className="c3">The categories of Personal Data collected</span>
                          </li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">The sources from which the Personal Data was collected</span>
                          </li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">The business or commercial purpose for collecting or selling the
        Personal Data</span></li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">Categories of third parties with whom We share Personal Data</span>
                          </li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">The specific pieces of Personal Data we collected about You</span>
                          </li>
                        </ul>
                        <ul className="c13 lst-kix_bcezjntvopjy-0">
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right to delete Personal Data. You also have the right to
        request the deletion of Your Personal Data that have been collected in the past 12 months.</span></li>
                          <li className="c0 c12 li-bullet-0"><span className="c3">The right not to be discriminated against. You have the right not to
        be discriminated against for exercising any of Your Consumer&#39;s rights, including by:</span></li>
                        </ul>
                        <ul className="c13 lst-kix_bcezjntvopjy-1 start">
                          <li className="c0 c6 li-bullet-0"><span className="c3">Denying goods or services to You</span>
                          </li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">Charging different prices or rates for goods or services, including
        the use of discounts or other benefits or imposing penalties</span></li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">Providing a different level or quality of goods or services to
        You</span></li>
                          <li className="c0 c6 li-bullet-0"><span className="c3">Suggesting that You will receive a different price or rate for goods
        or services or a different level or quality of goods or services.</span></li>
                        </ul>
                        <p className="c0 c4"><span className="c3"></span></p>
                        <p><h2>Exercising Your CCPA Data Protection Rights</h2></p>
                        <p className="c0"><span className="c3">In order to exercise any of Your rights under the CCPA, and if you are a California
      resident, You can email or call us or visit our &quot;Do Not Sell My Personal Information&quot; section or web
      page.</span></p>
                        <p className="c0 c4"><span className="c3"></span></p>
                        <p className="c0"><span className="c7">The Company will disclose and deliver the required information free of charge within 45
      days of receiving Your verifiable request. The time period to provide the required information may be extended
      once by an additional 45 days when </span><span className="c7">reasonably </span><span className="c3">necessary and with
      prior notice.</span></p>
                        <p className="c0 c4"><span className="c3"></span></p>
                        <p className="c0 c4"><span className="c3"></span></p>
                        <p><h1>Do Not Sell My Personal Information</h1></p>
                        <hr/>
                          <p className="c0 c4"><span className="c5"></span></p>
                          <p className="c0 c4"><span className="c5"></span></p>
                          <p className="c0"><span className="c3">We do not sell personal information. However, the Service Providers we partner with
      (for example, our advertising partners) may use technology on the Service that &quot;sells&quot; personal
      information as defined by the CCPA law.</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p className="c0"><span className="c3">If you wish to opt out of the use of your personal information for interest-based
      advertising purposes and these potential sales as defined under CCPA law, you may do so by following the
      instructions below.</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p className="c0"><span className="c3">Please note that any opt out is specific to the browser You use. You may need to opt
      out on every browser that you use.</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p><h2>Website</h2></p>
                          <p className="c0"><span className="c3">You can opt out of receiving ads that are personalized as served by our Service
      Providers by following our instructions presented on the Service:</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <ul className="c13 lst-kix_glrsu53dvnb2-0 start">
                            <li className="c0 c12 li-bullet-0"><span
                              className="c3">From Our &quot;Cookie Consent&quot; notice banner</span></li>
                            <li className="c0 c12 li-bullet-0"><span
                              className="c3">Or from Our &quot;CCPA Opt-out&quot; notice banner</span></li>
                            <li className="c0 c12 li-bullet-0"><span className="c3">Or from Our &quot;Do Not Sell My Personal Information&quot; notice
        banner</span></li>
                            <li className="c0 c12 li-bullet-0"><span className="c3">Or from Our &quot;Do Not Sell My Personal Information&quot;
                              link</span></li>
                          </ul>
                          <p className="c0 c15 c4"><span className="c3"></span></p>
                          <p className="c0"><span className="c3">The opt out will place a cookie on Your computer that is unique to the browser You use
      to opt out. If you change browsers or delete the cookies saved by your browser, you will need to opt out
      again.</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p><h2>Mobile Devices</h2></p>
                          <p className="c0"><span className="c3">Your mobile device may give you the ability to opt out of the use of information about
      the apps you use in order to serve you ads that are targeted to your interests:</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <ul className="c13 lst-kix_j9p5pa84wmg0-0 start">
                            <li className="c0 c12 li-bullet-0"><span
                              className="c3">&quot;Opt out of Interest-Based Ads&quot; or &quot;Opt out of Ads
        Personalization&quot; on Android devices</span></li>
                            <li className="c0 c12 li-bullet-0"><span className="c3">&quot;Limit Ad Tracking&quot; on iOS devices</span>
                            </li>
                          </ul>
                          <p className="c0 c15 c4"><span className="c3"></span></p>
                          <p className="c0"><span className="c3">You can also stop the collection of location information from Your mobile device by
      changing the preferences on your mobile device.</span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p className="c0 c4"><span className="c3"></span></p>
                          <p><h1>&quot;Do Not Track&quot; Policy as Required by California Online Privacy Protection Act
      (CalOPPA)</h1></p>
                          <hr/>
                            <p className="c0 c4"><span className="c5"></span></p>
                            <p className="c0 c4"><span className="c5"></span></p>
                            <p className="c0"><span
                              className="c3">Our Service does not respond to Do Not Track signals.</span></p>
                            <p className="c0 c4"><span className="c3"></span></p>
                            <p className="c0"><span className="c3">However, some third party websites do keep track of Your browsing activities. If You
      are visiting such websites, You can set Your preferences in Your web browser to inform websites that You do not
      want to be tracked. You can enable or disable DNT by visiting the preferences or settings page of Your web
      browser.</span></p>
                            <p className="c0 c4"><span className="c3"></span></p>
                            <p className="c0 c4"><span className="c3"></span></p>
                            <p><h1>Your California Privacy Rights (California&#39;s Shine the Light law)</h1>
                            </p>
                            <hr/>
                              <p className="c0 c4"><span className="c5"></span></p>
                              <p className="c0 c4"><span className="c5"></span></p>
                              <p className="c0"><span className="c3">Under California Civil Code Section 1798 (California&#39;s Shine the Light law),
      California residents with an established business relationship with us can request information once a year about
      sharing their Personal Data with third parties for the third parties&#39; direct marketing purposes.</span></p>
                              <p className="c0 c4"><span className="c3"></span></p>
                              <p className="c0"><span className="c7">If you&#39;d like to request more information under the California Shine the Light law,
      and if you are a California resident, You can contact Us using the contact information provided below.</span></p>
                              <p className="c11"><span
                                className="c3">The California Code of Regulations defines a &ldquo;resident&rdquo; as:</span>
                              </p>
                              <p className="c11 c15"><span className="c3">(1) &nbsp;every individual who is in the State of California for other than a
      temporary or transitory purpose and</span></p>
                              <p className="c11 c15"><span className="c3">(2) every individual who is domiciled in the State of California who is outside
      the State of California for a temporary or transitory purpose</span></p>
                              <p className="c11"><span
                                className="c3">All other individuals are defined as &ldquo;non-residents.&rdquo;</span>
                              </p>
                              <p className="c11"><span
                                className="c3">If this definition of &ldquo;resident&rdquo; applies to you, we must adhere to certain
      rights and obligations regarding your personal information.</span></p>
                              <p className="c11 c4"><span className="c3"></span></p>
                              <p><h1>California Privacy Rights for Minor Users (California Business and Professions Code
      Section 22581)</h1></p>
                              <hr/>
                                <p className="c0 c4"><span className="c5"></span></p>
                                <p className="c0 c4"><span className="c5"></span></p>
                                <p className="c0"><span className="c3">California Business and Professions Code section 22581 allows California residents
      under the age of 18 who are registered users of online sites, services or applications to request and obtain
      removal of content or information they have publicly posted.</span></p>
                                <p className="c0 c4"><span className="c3"></span></p>
                                <p className="c0"><span className="c3">To request removal of such data, and if you are a California resident, You can contact
      Us using the contact information provided below, and include the email address associated with Your
      account.</span></p>
                                <p className="c0 c4"><span className="c3"></span></p>
                                <p className="c0"><span className="c3">Be aware that Your request does not guarantee complete or comprehensive removal of
      content or information posted online and that the law may not permit or require removal in certain
      circumstances.</span></p>
                                <p className="c0 c4"><span className="c3"></span></p>
                                <p className="c0"><span className="c7">We do not knowingly solicit data from or market to children under 18 years of age. By
      using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor
      and consent to such minor dependent&rsquo;s use of the Services. If we learn that personal information from users
      less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to
      promptly delete such data from our records. If you become aware of any data we may have collected from children
      under age 18, please contact us at </span><span className="c17 c7"><a className="c23"
                                                                            href="mailto:gnothi@gnothiai.com" target="_blank">gnothi@gnothiai.com</a></span>
                                </p>
                                <p className="c0 c4"><span className="c7 c25"></span></p>
                                <p className="c0 c4"><span className="c25 c7"></span></p>
                                <p><h1>Links to Other Websites</h1></p>
                                <hr/>
                                  <p className="c0 c4"><span className="c5"></span></p>
                                  <p className="c0 c4"><span className="c5"></span></p>
                                  <p className="c0"><span className="c3">Our Service may contain links to other websites that are not operated by Us. If You
      click on a third party link, You will be directed to that third party&#39;s site. We strongly advise You to review
      the Privacy Policy of every site You visit.</span></p>
                                  <p className="c0 c4"><span className="c3"></span></p>
                                  <p className="c0"><span className="c3">We have no control over and assume no responsibility for the content, privacy policies
      or practices of any third party sites or services.</span></p>
                                  <p className="c0 c4"><span className="c3"></span></p>
                                  <p className="c0 c4"><span className="c3"></span></p>
                                  <p><h1>Changes to this Privacy Policy</h1></p>
                                  <hr/>
                                    <p className="c0 c4"><span className="c5"></span></p>
                                    <p className="c0 c4"><span className="c5"></span></p>
                                    <p className="c0"><span className="c3">We may update our Privacy Policy from time to time. We will notify You of any changes
      by posting the new Privacy Policy on this page.</span></p>
                                    <p className="c0 c4"><span className="c3"></span></p>
                                    <p className="c0"><span className="c3">We will let You know via email and/or a prominent notice on Our Service, prior to the
      change becoming effective and update the &quot;Last updated&quot; date at the top of this Privacy Policy.</span>
                                    </p>
                                    <p className="c0 c4"><span className="c3"></span></p>
                                    <p className="c0"><span className="c3">You are advised to review this Privacy Policy periodically for any changes. Changes to
      this Privacy Policy are effective when they are posted on this page.</span></p>
                                    <p className="c0 c4"><span className="c3"></span></p>
                                    <p className="c0 c4"><span className="c3"></span></p>
                                    <p><h1>Contact Us</h1></p>
                                    <hr/>
                                      <p className="c0 c4"><span className="c5"></span></p>
                                      <p className="c0 c4"><span className="c5"></span></p>
                                      <p className="c0"><span className="c7">If you have any questions about this Privacy Policy, You can contact us via email at </span><span className="c17 c7"><a className="c23" href="mailto:gnothi@gnothiai.com" target="_blank">gnothi@gnothiai.com</a></span>
                                      </p>


                                    </>
  </Box>
}
