"use client";

import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const AddEmployeePage: React.FC = () => {
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  // Correctly define all teams and their specific departments
  const allDepartments: { [key: string]: string[] } = {
    Tech: [
      'Senior Full Stack Developer',
      'Junior Full Stack Developer',
      'Hybrid Mobile Developer',
      'Product Manager',
      'Project Manager',
      'QA Engineer – Manual & Automation',
      'Social Media Manager & Content Writer',
      'UI/UX Developer',
      'IT Administrator',
    ],
    Accounts: ['Accountant', 'Senior Accountant'],
    'Admin & Operations': ['Admin & Operations'], // Team 'Admin & Operations' maps to Department 'Admin & Operations'
    HR: ['HR'], // Team 'HR' maps to Department 'HR'
  };
  

  const validationSchema = Yup.object({
    empId: Yup.string()
      .matches(/^[A-Z0-9]+$/, 'Employee ID must contain only uppercase letters and numbers')
      .required('Employee ID is required'),
    name: Yup.string()
      .matches(/^[A-Z][a-zA-Z\s]*$/, 'Name must start with a capital letter')
      .required('Name is required'),
    fatherName: Yup.string()
      .matches(/^[A-Z][a-zA-Z\s]*$/, "Father's name must start with a capital letter")
      .required("Father's name is required"),
    dateOfBirth: Yup.date()
      .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), 'Employee must be at least 18 years old')
      .required('Date of birth is required'),
    joiningDate: Yup.date()
      .required('Joining date is required'),
    team: Yup.string().required('Team is required'),
    department: Yup.string().required('Department is required'),
    photo: Yup.mixed()
      .test('fileFormat', 'Only PNG, JPEG, and JPG formats are allowed', (value) => {
        if (!value) return true;
        const file = value as File;
        return ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
      }),
    phoneNumber: Yup.string()
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
      .required('Phone number is required'),
    mailId: Yup.string().email('Invalid email address').required('Email is required'),
    accountNumber: Yup.string()
      .matches(/^[0-9]{9,18}$/, 'Account number must be between 9-18 digits')
      .required('Account number is required'),
    ifscCode: Yup.string()
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., SBIN0001234)')
      .required('IFSC code is required')
  });

  const formik = useFormik({
    initialValues: {
      empId: '',
      name: '',
      fatherName: '',
      dateOfBirth: '',
      joiningDate: '',
      team: '',
      department: '',
      photo: null as File | null,
      phoneNumber: '',
      mailId: '',
      accountNumber: '',
      ifscCode: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const data = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'empId' || key === 'ifscCode') data.append(key, (value as string).toUpperCase());
          else data.append(key, value as string | Blob);
        }
      });

      try {
        const res = await fetch('/api/employees/add', {
          method: 'POST',
          body: data
        });

        const result = await res.json();
        
        if (result.success) {
            alert('Employee Added Successfully! 🎉');
            formik.resetForm();
            setDepartmentOptions([]); // reset department options
        } else {
            alert(`Error: ${result.message}`);
        }
      } catch (error) {
        alert('Error submitting form. Please check your network connection.');
        console.error(error);
      }
    }
  });

  // Update departments when team changes
  useEffect(() => {
    const selectedTeam = formik.values.team;
    
    // Clear the current department
    formik.setFieldValue('department', ''); 

    // Look up departments based on the selected team string
    if (allDepartments[selectedTeam]) {
      setDepartmentOptions(allDepartments[selectedTeam]);
    } else {
      setDepartmentOptions([]);
    }
    
  }, [formik.values.team]);

  const inputBaseClass = 'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900';
  const getInputClass = (field: keyof typeof formik.initialValues) => {
    return `${inputBaseClass} ${
      formik.touched[field] && formik.errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-white px-8 py-6">
            <h2 className="text-3xl font-bold text-black">Add New Employee</h2>
            <p className="text-black mt-2">Fill in the details to register a new employee</p>
          </div>

          <form className="p-8" onSubmit={formik.handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID *</label>
                <input
                  type="text"
                  name="empId"
                  placeholder="e.g., LP012" // Added Placeholder
                  value={formik.values.empId}
                  onChange={(e) => formik.setFieldValue('empId', e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur}
                  className={getInputClass('empId')}
                />
                {formik.touched.empId && formik.errors.empId && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.empId}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., John Doe" // Added Placeholder
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('name')}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.name}</p>
                )}
              </div>
              
              {/* Father's Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name *</label>
                <input
                  type="text"
                  name="fatherName"
                  placeholder="e.g., Michael Doe" // Added Placeholder
                  value={formik.values.fatherName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('fatherName')}
                />
                {formik.touched.fatherName && formik.errors.fatherName && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.fatherName}</p>
                )}
              </div>

              {/* Date of Birth (Type date doesn't typically need a placeholder, but keeping the field structure) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('dateOfBirth')}
                />
                {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.dateOfBirth}</p>
                )}
              </div>

              {/* Joining Date (Type date doesn't typically need a placeholder, but keeping the field structure) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date *</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formik.values.joiningDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('joiningDate')}
                />
                {formik.touched.joiningDate && formik.errors.joiningDate && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.joiningDate}</p>
                )}
              </div>

              {/* Team (Select field, placeholders not applicable) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team *</label>
                <select
                  name="team"
                  value={formik.values.team}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('team')}
                >
                  <option value="">Select Team</option>
                  <option value="Tech">Tech</option>
                  <option value="Accounts">Accounts</option>
                  <option value="HR">HR</option> 
                  <option value="Admin & Operations">Admin & Operations</option> 
                </select>
                {formik.touched.team && formik.errors.team && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.team}</p>
                )}
              </div>

              {/* Department (Select field, placeholders not applicable) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                <select
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('department')}
                  disabled={departmentOptions.length === 0}
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {formik.touched.department && formik.errors.department && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.department}</p>
                )}
              </div>

              {/* Photo (File input, placeholders not applicable) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Photo</label>
                <input
                  type="file"
                  name="photo"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={(e) => formik.setFieldValue('photo', e.target.files?.[0] || null)}
                  onBlur={formik.handleBlur}
                  className={`${inputBaseClass} ${formik.touched.photo && formik.errors.photo ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formik.touched.photo && formik.errors.photo && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.photo}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="e.g., 9876543210 (10 digits)" // Added Placeholder
                  maxLength={10}
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('phoneNumber')}
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.phoneNumber}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="mailId"
                  placeholder="e.g., john.doe@example.com" // Added Placeholder
                  value={formik.values.mailId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('mailId')}
                />
                {formik.touched.mailId && formik.errors.mailId && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.mailId}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number *</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="e.g., 123456789012" // Added Placeholder
                  value={formik.values.accountNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={getInputClass('accountNumber')}
                />
                {formik.touched.accountNumber && formik.errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.accountNumber}</p>
                )}
              </div>

              {/* IFSC */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code *</label>
                <input
                  type="text"
                  name="ifscCode"
                  placeholder="e.g., SBIN0001234 (11 characters)" // Added Placeholder
                  maxLength={11}
                  value={formik.values.ifscCode}
                  onChange={(e) => formik.setFieldValue('ifscCode', e.target.value.toUpperCase())}
                  onBlur={formik.handleBlur}
                  className={getInputClass('ifscCode')}
                />
                {formik.touched.ifscCode && formik.errors.ifscCode && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.ifscCode}</p>
                )}
              </div>

            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {formik.isSubmitting ? 'Adding Employee...' : 'Add Employee'}
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setDepartmentOptions([]);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePage;