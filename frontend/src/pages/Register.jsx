import React, { useState } from 'react';
import { registerUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Mail, Lock, Phone, MapPin, Building, Briefcase, Eye, EyeOff, Check, AlertCircle, Cloud, Sun, CloudRain, Zap, Wind } from 'lucide-react';
import { Container, WeatherElement, FloatingParticle, GradientOverlay, FormWrapper, Header, LogoContainer, Title, Subtitle, ProgressContainer, ProgressWrapper, ProgressStep, ProgressLine, FormContainer, FormContent, StepContainer, StepTitle, InputRow, InputGroup, InputWrapper, IconWrapper, StyledInput, RightIconWrapper, ErrorMessage, ButtonRow, Button, FooterText, FooterLink } from '../styles/register';

// Input Field Component - moved outside to prevent re-creation
const InputField = ({
    icon: Icon,
    type = "text",
    name,
    placeholder,
    showToggle = false,
    formData,
    errors,
    touched,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleBlur,
    getMaxDate,
    getMinDate
}) => {
    const isPassword = name === 'password' || name === 'confirmPassword';
    const showPasswordState = name === 'password' ? showPassword : showConfirmPassword;
    const setShowPasswordState = name === 'password' ? setShowPassword : setShowConfirmPassword;
    const hasError = errors[name] && touched[name];
    const hasSuccess = !errors[name] && formData[name] && touched[name];

    const inputProps = {
        type: isPassword && !showPasswordState ? "password" : type,
        name,
        value: formData[name],
        onChange: handleInputChange,
        onBlur: handleBlur,
        placeholder,
        hasError,
        hasRightIcon: isPassword || hasError || hasSuccess,
        ...(name === 'dateOfBirth' && {
            max: getMaxDate(),
            min: getMinDate()
        })
    };

    return (
        <InputGroup>
            <InputWrapper>
                <IconWrapper>
                    <Icon size={18} />
                </IconWrapper>
                <StyledInput {...inputProps} />
                {isPassword && (
                    <RightIconWrapper
                        clickable
                        onClick={() => setShowPasswordState(!showPasswordState)}
                    >
                        {showPasswordState ? <EyeOff size={18} /> : <Eye size={18} />}
                    </RightIconWrapper>
                )}
                {!isPassword && hasSuccess && (
                    <RightIconWrapper success>
                        <Check size={18} />
                    </RightIconWrapper>
                )}
                {!isPassword && hasError && (
                    <RightIconWrapper error>
                        <AlertCircle size={18} />
                    </RightIconWrapper>
                )}
            </InputWrapper>
            {hasError && (
                <ErrorMessage>
                    <AlertCircle size={14} />
                    {errors[name]}
                </ErrorMessage>
            )}
        </InputGroup>
    );
};

const WeatherRegistrationForm = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        contact: '',
        password: '',
        confirmPassword: '',
        address: '',
        agency: '',
        position: '',
        birthday: '',
    });

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const validateField = (name, value) => {
        switch (name) {
            case 'firstName':
            case 'lastName':
                return value.trim().length < 2 ? 'Must be at least 2 characters' : '';
            case 'username':
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscore allowed';
                return '';
            case 'email':
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email' : '';
            case 'contact':
                return !/^(?:\+63|0)(9\d{9}|2\d{7,8}|[3-9]\d{7})$/.test(value.replace(/\s/g, ''))
                    ? 'Please enter a valid Philippine phone number'
                    : '';
            case 'password':
                if (value.length < 8) return 'Password must be at least 8 characters';
                if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Must contain uppercase, lowercase, and number';
                return '';
            case 'confirmPassword':
                return value !== formData.password ? 'Passwords do not match' : '';
            case 'birthday':
                if (!value) return 'Date of birth is required';
                const birthDate = new Date(value);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                if (birthDate > today) return 'Birth date cannot be in the future';
                if (age < 16) return 'Must be at least 16 years old';
                if (age > 120) return 'Please enter a valid birth date';
                return '';
            case 'address':
            case 'agency': // Update to 'agency' in backend
            case 'position':
                return value.trim().length < 2 ? 'This field is required' : '';
            default:
                return '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        const newTouched = {};

        // Perform field validation
        Object.keys(formData).forEach(key => {
            newTouched[key] = true;
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        setTouched(newTouched);
        setErrors(newErrors);

        // If no validation errors, proceed with user registration
        if (Object.keys(newErrors).length === 0) {
            try {
                // Call registerUser to send the form data to the backend
                const data = await registerUser(formData);
                alert('Registration successful! Welcome to VOTE WAVE!');
                navigate('/login');
            } catch (error) {
                console.error('Registration error:', error.message);
                alert('Registration failed. Please try again.');
            }
        }
    };

    const handleSignInClick = () => {
        navigate('/login');
    };

    const nextStep = () => {
        const step1Fields = ['firstName', 'lastName', 'username', 'email'];
        const step1Errors = {};
        const step1Touched = {};

        step1Fields.forEach(field => {
            step1Touched[field] = true;
            const error = validateField(field, formData[field]);
            if (error) step1Errors[field] = error;
        });

        setTouched(prev => ({ ...prev, ...step1Touched }));
        setErrors(prev => ({ ...prev, ...step1Errors }));

        if (Object.keys(step1Errors).length === 0) {
            setCurrentStep(2);
        }
    };

    const prevStep = () => {
        setCurrentStep(1);
    };

    const getMaxDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMinDate = () => {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 120);
        return minDate.toISOString().split('T')[0];
    };

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

            <FormWrapper>
                {/* Header */}
                <Header>
                    <LogoContainer>
                        <img
                            src="/pagasa-logo.png"  // Reference to the logo image in the public folder
                            alt="Logo"
                            style={{ width: '60px', height: 'auto' }}  // Adjust size as needed
                        />
                    </LogoContainer>
                    <Title>PAGASA</Title>
                    <Subtitle>Philippine Atmospheric, Geophysical and Astronomical Services Administration</Subtitle>
                </Header>

                {/* Progress indicator */}
                <ProgressContainer>
                    <ProgressWrapper>
                        <ProgressStep active={currentStep >= 1}>1</ProgressStep>
                        <ProgressLine active={currentStep >= 2} />
                        <ProgressStep active={currentStep >= 2}>2</ProgressStep>
                    </ProgressWrapper>
                </ProgressContainer>

                {/* Form Container */}
                <FormContainer>
                    <FormContent>
                        {currentStep === 1 && (
                            <StepContainer direction="right">
                                <StepTitle>Personal Information</StepTitle>

                                <InputRow>
                                    <InputField
                                        icon={User}
                                        name="firstName"
                                        placeholder="First Name"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />
                                    <InputField
                                        icon={User}
                                        name="lastName"
                                        placeholder="Last Name"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />
                                </InputRow>

                                <InputField
                                    icon={User}
                                    name="username"
                                    placeholder="Username"
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <InputField
                                    icon={Mail}
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <Button primary onClick={nextStep}>
                                    Continue to Next Step
                                </Button>
                            </StepContainer>
                        )}

                        {currentStep === 2 && (
                            <StepContainer direction="left">
                                <StepTitle>Complete Your Profile</StepTitle>

                                <InputField
                                    icon={Phone}
                                    type="tel"
                                    name="contact"
                                    placeholder="Phone Number"
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <InputField
                                    icon={Calendar}
                                    type="date"
                                    name="birthday"
                                    placeholder="Date of Birth"
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <InputField
                                    icon={MapPin}
                                    name="address"
                                    placeholder="Address"
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <InputRow>
                                    <InputField
                                        icon={Building}
                                        name="agency" // Update 'company' to 'agency' in backend
                                        placeholder="Agency"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />
                                    <InputField
                                        icon={Briefcase}
                                        name="position"
                                        placeholder="Position"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />
                                </InputRow>

                                <InputField
                                    icon={Lock}
                                    name="password"
                                    placeholder="Password"
                                    showToggle={true}
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <InputField
                                    icon={Lock}
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    showToggle={true}
                                    formData={formData}
                                    errors={errors}
                                    touched={touched}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmPassword={setShowConfirmPassword}
                                    handleInputChange={handleInputChange}
                                    handleBlur={handleBlur}
                                    getMaxDate={getMaxDate}
                                    getMinDate={getMinDate}
                                />

                                <ButtonRow>
                                    <Button onClick={prevStep}>Back</Button>
                                    <Button primary onClick={handleSubmit}>Create Account</Button>
                                </ButtonRow>
                            </StepContainer>
                        )}
                    </FormContent>

                    <FooterText>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Already have an account?{' '}
                            <FooterLink onClick={handleSignInClick} style={{ cursor: 'pointer' }}>
                                Sign in here
                            </FooterLink>
                        </p>
                    </FooterText>
                </FormContainer>
            </FormWrapper>
        </Container>
    );
};

export default WeatherRegistrationForm;
