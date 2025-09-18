'use client';

import { useState } from 'react';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';

interface FormData {
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  [key: string]: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    from_name: '',
    from_email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSent, setIsSent] = useState(false);

  const validate = (): Partial<FormData> => {
    const newErrors: Partial<FormData> = {};
    if (!formData.from_name.trim()) newErrors.from_name = 'Name is required';
    if (!formData.from_email) newErrors.from_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.from_email)) newErrors.from_email = 'Email is invalid';
    if (!formData.subject) newErrors.subject = 'Please choose a subject';
    if (!formData.message.trim()) newErrors.message = 'Message cannot be empty';
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length !== 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const result: EmailJSResponseStatus = await emailjs.send(
        'service_uv0vxja',
        'template_tz5xm79',
        formData,
        'phKaaqTvGUlJ-TvKe'
      );
      console.log(result.status, result.text);
      setIsSent(true);
      setFormData({ from_name: '', from_email: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section>
      {/* Hero Section */}
      <div
        className="relative h-[300px] md:h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url('/images/contact-bg.avif')` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Let’s Hear from You</h1>
          <p className="text-lg">Reach out to us with your questions or feedback.</p>
        </div>
      </div>

      {/* Form & Contact Info */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Send Us a Message</h2>
          {isSent && <p className="text-green-600 mb-4">Message sent successfully!</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="from_name"
              placeholder="Your Name"
              value={formData.from_name}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {errors.from_name && <p className="text-sm text-red-500">{errors.from_name}</p>}

            <input
              type="email"
              name="from_email"
              placeholder="Your Email"
              value={formData.from_email}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {errors.from_email && <p className="text-sm text-red-500">{errors.from_email}</p>}

            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Select a Subject</option>
              <option>General Inquiry</option>
              <option>Admissions</option>
              <option>Partnership</option>
              <option>Feedback</option>
            </select>
            {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}

            <textarea
              name="message"
              rows={5}
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}

            <button
              type="submit"
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
            >
              Submit
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-6 text-gray-700">
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-semibold mb-4">Contact Info</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-400" />
                
peace estate Igbo Olomu Rd
Ikorodu,              </li>
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faPhone} className="text-red-400" />
                +234 805 582 0239
              </li>
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="text-red-400" />
                yanoschoools@gmail.com
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-semibold mb-4">Office Hours</h2>
            <p>
              Monday – Friday: 8:00 AM – 4:00 PM <br />
              Saturday: 9:00 AM – 12:00 PM
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-semibold mb-4">Departments</h2>
            <ul className="space-y-3">
              <li><strong>Principal:</strong>yanocon@yahoo.com</li>
              <li><strong>Accounts:</strong> yanoschoools@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Find Us on the Map</h2>
        <div className="rounded-xl overflow-hidden shadow-lg h-64 border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!4v1722342125622!6m8!1m7!1s0zSgmJS1a5d5sNIXHIoEFQ!2m2!1d6.6906726!2d3.4684387!3f162.6016!4f0.2211!5f0.7820865974627469"
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
            title="Yano School Location"
            className="border-none"
          ></iframe>
        </div>
        <a
          href="https://www.google.com/maps/@6.6906726,3.4684387,3a,77.7y,162.6h,89.78t/data=!3m7!1e1!3m5!1s0zSgmJS1a5d5sNIXHIoEFQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0.2211199999999991%26panoid%3D0zSgmJS1a5d5sNIXHIoEFQ%26yaw%3D162.6016!7i16384!8i8192?entry=ttu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-500 hover:underline text-sm mt-2 inline-block"
        >
          View in Google Street View
        </a>
      </div>
    </section>
  );
}
