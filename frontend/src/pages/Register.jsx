// pages/Register.jsx — Multi-field registration with email OTP verification
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import OtpInput from '../components/OtpInput';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone, HiOutlineIdentification, HiOutlineCalendar } from 'react-icons/hi';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    dob: '', uniqueId: '', mobile: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        dob: form.dob,
        uniqueId: form.uniqueId,
        mobile: form.mobile,
      });
      toast.success('Registration successful! Check your email for OTP');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = async (otp) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-email', { email: form.email, otp });
      login(res.data.data.token, res.data.data.user);
      toast.success('Email verified! Please set up Face ID.');
      navigate('/face-setup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: HiOutlineUser, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', icon: HiOutlineMail, placeholder: 'you@example.com' },
    { name: 'dob', label: 'Date of Birth', type: 'date', icon: HiOutlineCalendar },
    { name: 'uniqueId', label: 'Unique ID (Aadhar/SSN)', type: 'text', icon: HiOutlineIdentification, placeholder: 'XXXX-XXXX-XXXX' },
    { name: 'mobile', label: 'Mobile Number', type: 'tel', icon: HiOutlinePhone, placeholder: '+91 9876543210' },
    { name: 'password', label: 'Password', type: 'password', icon: HiOutlineLockClosed, placeholder: '••••••••' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: HiOutlineLockClosed, placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-gradient-auth flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <HiOutlineShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Create Account</h1>
          <p className="text-text-secondary mt-1">Join SecureCast voting platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {fields.map(({ name, label, type, icon: Icon, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder={placeholder}
                      required
                      id={`register-${name}`}
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-12 text-base mt-2"
                id="register-submit"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📧</div>
                <h3 className="text-lg font-semibold text-text-primary">Verify Your Email</h3>
                <p className="text-text-secondary text-sm mt-1">
                  Enter the 6-digit code sent to <span className="text-primary-light">{form.email}</span>
                </p>
              </div>

              <OtpInput onComplete={handleOTP} disabled={loading} />

              {loading && (
                <div className="flex justify-center">
                  <LoadingSpinner size="sm" text="Verifying..." />
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-text-muted hover:text-text-primary transition"
              >
                ← Back to registration
              </button>
            </motion.div>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-light hover:text-primary font-medium transition">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
