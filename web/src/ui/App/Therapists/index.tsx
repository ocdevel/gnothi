import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  Rating,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideocamIcon from '@mui/icons-material/Videocam';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

// Mock data for therapists
const mockTherapists = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    photo: "SJ",
    specialties: ["Anxiety", "Depression", "CBT"],
    location: "New York, NY",
    remote: true,
    insurances: ["Blue Cross", "Aetna"],
    bio: "Specializing in anxiety and depression with 10 years of experience in CBT.",
    sessionFee: 150,
    slidingScale: true,
    rating: 4.8,
    acceptingClients: true,
    matchScore: 92
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    photo: "MC",
    specialties: ["Trauma", "PTSD", "EMDR"],
    location: "San Francisco, CA",
    remote: true,
    insurances: ["Cigna", "United Healthcare"],
    bio: "Trauma specialist with expertise in EMDR therapy.",
    sessionFee: 180,
    slidingScale: false,
    rating: 4.9,
    acceptingClients: true,
    matchScore: 85
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    photo: "ER",
    specialties: ["Relationships", "Family Therapy", "DBT"],
    location: "Miami, FL",
    remote: false,
    insurances: ["Medicare", "Medicaid"],
    bio: "Family therapist specializing in relationship dynamics and DBT.",
    sessionFee: 130,
    slidingScale: true,
    rating: 4.7,
    acceptingClients: false,
    matchScore: 78
  }
];

const specialtiesList = [
  'Anxiety',
  'Depression',
  'PTSD',
  'Trauma',
  'Relationships',
  'Family Therapy',
  'CBT',
  'DBT',
  'EMDR'
];

const insurancesList = [
  'Blue Cross',
  'Aetna',
  'Cigna',
  'United Healthcare',
  'Medicare',
  'Medicaid'
];

export default function Therapists() {
  const [filters, setFilters] = useState({
    specialties: [],
    insurances: [],
    location: '',
    remote: 'all',
    maxFee: '',
    acceptingClients: false
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredTherapists = mockTherapists.filter(therapist => {
    if (filters.specialties.length && !filters.specialties.some(s => therapist.specialties.includes(s))) return false;
    if (filters.insurances.length && !filters.insurances.some(i => therapist.insurances.includes(i))) return false;
    if (filters.location && !therapist.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.remote !== 'all' && therapist.remote !== (filters.remote === 'yes')) return false;
    if (filters.maxFee && therapist.sessionFee > parseInt(filters.maxFee)) return false;
    if (filters.acceptingClients && !therapist.acceptingClients) return false;
    return true;
  });

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={specialtiesList}
                value={filters.specialties}
                onChange={(_, value) => handleFilterChange('specialties', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Specialties" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={insurancesList}
                value={filters.insurances}
                onChange={(_, value) => handleFilterChange('insurances', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Insurance" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Remote Sessions</InputLabel>
                <Select
                  value={filters.remote}
                  label="Remote Sessions"
                  onChange={(e) => handleFilterChange('remote', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Remote Only</MenuItem>
                  <MenuItem value="no">In-Person Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Session Fee"
                type="number"
                value={filters.maxFee}
                onChange={(e) => handleFilterChange('maxFee', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <Button
                  variant={filters.acceptingClients ? "contained" : "outlined"}
                  onClick={() => handleFilterChange('acceptingClients', !filters.acceptingClients)}
                >
                  Accepting Clients
                </Button>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {filteredTherapists.length} Therapists Found
      </Typography>
      
      <Grid container spacing={3}>
        {filteredTherapists.map((therapist) => (
          <Grid item xs={12} md={6} lg={4} key={therapist.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>{therapist.photo}</Avatar>
                  <Box>
                    <Typography variant="h6">{therapist.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={therapist.rating} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        ({therapist.rating})
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                    {therapist.matchScore}% Match
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>{therapist.bio}</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {therapist.specialties.map((specialty) => (
                    <Chip key={specialty} label={specialty} size="small" />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" />
                    <Typography variant="body2">{therapist.location}</Typography>
                  </Box>
                  {therapist.remote && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideocamIcon fontSize="small" />
                      <Typography variant="body2">Offers remote sessions</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon fontSize="small" />
                    <Typography variant="body2">
                      ${therapist.sessionFee}/session
                      {therapist.slidingScale && " (Sliding scale available)"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!therapist.acceptingClients}
                  >
                    {therapist.acceptingClients ? "Request Consultation" : "Not Accepting Clients"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
