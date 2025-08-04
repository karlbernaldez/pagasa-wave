import { fetchUserDetails } from '../api/userAPI';
import { jwtDecode } from 'jwt-decode';
import { loginUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Cloud, Sun, CloudRain, Zap, Wind, AlertCircle, Check } from 'lucide-react';
import { Container, WeatherElement, FloatingParticle, GradientOverlay, FormWrapper, Header, LogoContainer, Title, Subtitle, FormContainer, Form, InputGroup, InputWrapper, IconWrapper, StyledInput, RightIconWrapper, ErrorMessage, Button, FooterText, FooterLink, BackButton, ForgotPassword } from '../styles/login';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      window.location.href = '/edit';
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          // Note: Using in-memory storage instead of localStorage for artifact compatibility
          window.userLocation = coords;
        },
        (err) => {
          console.warn('[Geolocation Error]', err.message);
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
    }
  }, []);

  const validateEmail = (email) => {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Please enter a valid email' : '';
  };

  const validatePassword = (password) => {
    return password.length < 1 ? 'Password is required' : '';
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (touched.email) {
      setError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (touched.password) {
      setError('');
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

    try {
      const res = await loginUser({ email, password });
      const token = res.accessToken;

      if (!token) throw new Error('No token received from the server.');

      const decoded = jwtDecode(token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(decoded));
      const userData = await fetchUserDetails(decoded.id, token);
      console.log('Login successful:', userData);

      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/edit');
      }

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const hasEmailSuccess = touched.email && !emailError && email;
  const hasPasswordSuccess = touched.password && !passwordError && password;

  return (
    <Container>
      {/* Weather-themed background elements */}
      <WeatherElement className="cloud-1">
        <Cloud size={80} />
      </WeatherElement>
      <WeatherElement className="cloud-2">
        <Cloud size={60} />
      </WeatherElement>
      <WeatherElement className="cloud-rain">
        <CloudRain size={70} />
      </WeatherElement>
      <WeatherElement className="sun">
        <Sun size={90} />
      </WeatherElement>
      <WeatherElement className="lightning-1">
        <Zap size={50} />
      </WeatherElement>
      <WeatherElement className="lightning-2">
        <Zap size={40} />
      </WeatherElement>
      <WeatherElement className="wind">
        <Wind size={60} />
      </WeatherElement>

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle key={i} />
      ))}

      {/* Gradient overlay */}
      <GradientOverlay />

      {/* Back button */}
      <BackButton onClick={() => navigate('/')}>
        <ArrowLeft size={18} />
      </BackButton>

      <FormWrapper>
        {/* Header */}
        <Header>
          <LogoContainer>
            <img src="/pagasa-logo.png" alt="PAGASA Logo" />
          </LogoContainer>
          <Title>PAGASA</Title>
          <Subtitle>Philippine Atmospheric, Geophysical and Astronomical Services Administration</Subtitle>
        </Header>

        {/* Form Container */}
        <FormContainer>
          <Form onSubmit={handleLogin}>
            {error && (
              <ErrorMessage>
                <AlertCircle size={16} />
                {error}
              </ErrorMessage>
            )}

            <InputGroup>
              <InputWrapper>
                <IconWrapper>
                  <Mail size={18} />
                </IconWrapper>
                <StyledInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  hasError={!!emailError}
                  hasRightIcon={hasEmailSuccess}
                />
                {hasEmailSuccess && (
                  <RightIconWrapper success>
                    <Check size={18} />
                  </RightIconWrapper>
                )}
              </InputWrapper>
              {emailError && (
                <ErrorMessage>
                  <AlertCircle size={14} />
                  {emailError}
                </ErrorMessage>
              )}
            </InputGroup>

            <InputGroup>
              <InputWrapper>
                <IconWrapper>
                  <Lock size={18} />
                </IconWrapper>
                <StyledInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  hasError={!!passwordError}
                  hasRightIcon={true}
                />
                <RightIconWrapper
                  clickable
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </RightIconWrapper>
              </InputWrapper>
              {passwordError && (
                <ErrorMessage>
                  <AlertCircle size={14} />
                  {passwordError}
                </ErrorMessage>
              )}
            </InputGroup>

            <ForgotPassword>
              Forgot password?
            </ForgotPassword>

            <Button type="submit">
              Log In
            </Button>

            <FooterText>
              Don't have an account?{' '}
              <FooterLink onClick={() => navigate('/register')}>
                Register here
              </FooterLink>
            </FooterText>
          </Form>
        </FormContainer>
      </FormWrapper>
    </Container>
  );
};

export default Login;