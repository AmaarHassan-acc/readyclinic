import { useMemo, useState } from 'react';

const labels = {
  en: {
    appName: 'ReadyClinic ERP',
    lang: 'العربية',
    pages: {
      PatientRegistration: 'Patient Registration',
      SelectDoctorServices: 'Doctor & Services',
      InvoiceCreate: 'Create Invoice',
      RegisterPayment: 'Register Payment',
      WaitingScreen: 'Waiting Screen',
      DoctorDashboard: 'Doctor Dashboard',
      ConsultationScreen: 'Consultation',
      AddPrescription: 'Add Prescription',
      AddExtraServices: 'Extra Services',
      PatientProfile: 'Patient Profile',
    },
    statuses: { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid', waiting: 'Waiting', in_consultation: 'In Consultation', done: 'Done' },
  },
  ar: {
    appName: 'نظام العيادة',
    lang: 'English',
    pages: {
      PatientRegistration: 'تسجيل المريض',
      SelectDoctorServices: 'اختيار الطبيب والخدمات',
      InvoiceCreate: 'إنشاء الفاتورة',
      RegisterPayment: 'تسجيل الدفع',
      WaitingScreen: 'شاشة الانتظار',
      DoctorDashboard: 'لوحة الطبيب',
      ConsultationScreen: 'الاستشارة',
      AddPrescription: 'إضافة وصفة',
      AddExtraServices: 'خدمات إضافية',
      PatientProfile: 'ملف المريض',
    },
    statuses: { unpaid: 'غير مدفوع', partial: 'جزئي', paid: 'مدفوع', waiting: 'انتظار', in_consultation: 'داخل الاستشارة', done: 'منتهي' },
  },
};

const doctors = [
  { id: 'd1', name: 'Dr. Sara Kareem', specialty: 'Internal Medicine' },
  { id: 'd2', name: 'Dr. Omar Khalid', specialty: 'Dermatology' },
  { id: 'd3', name: 'Dr. Noor Hassan', specialty: 'Pediatrics' },
];

const serviceCatalog = [
  { id: 's1', name: 'General Consultation', price: 40 },
  { id: 's2', name: 'Blood Test', price: 25 },
  { id: 's3', name: 'X-Ray', price: 60 },
  { id: 's4', name: 'ECG', price: 30 },
  { id: 's5', name: 'Nebulizer Session', price: 20 },
];

const initialPatients = [
  { id: 'p100', name: 'Lina Maher', phone: '555-0193', age: 31, gender: 'Female', prescriptions: [] },
  { id: 'p101', name: 'Hadi Sami', phone: '555-0172', age: 44, gender: 'Male', prescriptions: [] },
];

const navOrder = [
  'PatientRegistration',
  'SelectDoctorServices',
  'InvoiceCreate',
  'RegisterPayment',
  'WaitingScreen',
  'DoctorDashboard',
  'ConsultationScreen',
  'AddPrescription',
  'AddExtraServices',
  'PatientProfile',
];

function statusBadge(status, t) {
  return <span className={`badge ${status}`}>{t.statuses[status] || status}</span>;
}

export default function App() {
  const [lang, setLang] = useState('en');
  const t = labels[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [activePage, setActivePage] = useState('PatientRegistration');
  const [patients, setPatients] = useState(initialPatients);
  const [visits, setVisits] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0].id);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [queueFilter, setQueueFilter] = useState('all');

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedVisit = visits.find((v) => v.id === selectedVisitId) || visits.at(-1) || null;

  const totals = useMemo(() => {
    const totalRevenue = visits.reduce((sum, v) => sum + v.invoice.totalPaid, 0);
    const pending = visits.reduce((sum, v) => sum + Math.max(0, v.invoice.total - v.invoice.totalPaid), 0);
    return { totalRevenue, pending, waiting: visits.filter((v) => v.queueStatus === 'waiting').length };
  }, [visits]);

  const registerPatient = (payload) => {
    if (payload.mode === 'existing') {
      setSelectedPatientId(payload.patientId);
      return;
    }
    const id = `p${Math.floor(Math.random() * 900 + 1000)}`;
    const patient = { ...payload, id, prescriptions: [] };
    setPatients((prev) => [...prev, patient]);
    setSelectedPatientId(id);
  };

  const createVisit = ({ doctorId, services }) => {
    if (!selectedPatientId) return;
    const visitId = `v${Math.floor(Math.random() * 90000 + 10000)}`;
    const total = services.reduce((sum, s) => sum + s.price, 0);
    const visit = {
      id: visitId,
      patientId: selectedPatientId,
      doctorId,
      services,
      extraServices: [],
      queueStatus: 'unpaid',
      consultationStatus: 'pending',
      prescription: null,
      invoice: {
        id: `inv-${visitId}`,
        lines: services,
        total,
        totalPaid: 0,
      },
      payments: [],
    };
    setVisits((prev) => [...prev, visit]);
    setSelectedVisitId(visitId);
  };

  const registerPayment = (visitId, amount) => {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id !== visitId) return v;
        const totalPaid = Math.min(v.invoice.totalPaid + Number(amount), v.invoice.total);
        const status = totalPaid >= v.invoice.total ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
        const queueStatus = totalPaid > 0 ? 'waiting' : 'unpaid';
        return {
          ...v,
          queueStatus,
          invoice: { ...v.invoice, totalPaid, paymentStatus: status },
          payments: [...v.payments, { date: new Date().toISOString(), amount: Number(amount) }],
        };
      }),
    );
  };

  const startConsultation = (visitId) => {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, queueStatus: 'in_consultation', consultationStatus: 'active' } : v)));
    setSelectedVisitId(visitId);
    setActivePage('ConsultationScreen');
  };

  const savePrescription = (visitId, prescription) => {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, prescription, consultationStatus: 'done', queueStatus: 'done' } : v)));
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === visit.patientId
          ? { ...p, prescriptions: [...p.prescriptions, { ...prescription, visitId, date: new Date().toLocaleDateString() }] }
          : p,
      ),
    );
  };

  const addExtraService = (visitId, service) => {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id !== visitId) return v;
        const lines = [...v.invoice.lines, service];
        const total = lines.reduce((s, line) => s + line.price, 0);
        const paymentStatus = v.invoice.totalPaid >= total ? 'paid' : v.invoice.totalPaid > 0 ? 'partial' : 'unpaid';
        return {
          ...v,
          extraServices: [...v.extraServices, service],
          invoice: { ...v.invoice, lines, total, paymentStatus },
        };
      }),
    );
  };

  const assignedVisits = visits.filter((v) => doctorFilter === 'all' || v.doctorId === doctorFilter);
  const waitingVisits = visits.filter((v) => (queueFilter === 'all' ? true : v.queueStatus === queueFilter));

  return (
    <div className="app" dir={dir}>
      <aside className="sidebar">
        <h2>{t.appName}</h2>
        {navOrder.map((page) => (
          <button key={page} className={activePage === page ? 'nav active' : 'nav'} onClick={() => setActivePage(page)}>
            {t.pages[page]}
          </button>
        ))}
      </aside>
      <main>
        <header className="topbar card">
          <div>
            <strong>{selectedPatient ? selectedPatient.name : 'No patient selected'}</strong>
            <p>
              Visits: {visits.length} · Waiting: {totals.waiting} · Pending: ${totals.pending}
            </p>
          </div>
          <button className="btn" onClick={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}>
            {t.lang}
          </button>
        </header>

        <section className="metrics">
          <article className="card">
            <h4>Revenue</h4>
            <p>${totals.totalRevenue}</p>
          </article>
          <article className="card">
            <h4>Pending</h4>
            <p>${totals.pending}</p>
          </article>
          <article className="card">
            <h4>Current Queue</h4>
            <p>{totals.waiting}</p>
          </article>
        </section>

        {activePage === 'PatientRegistration' && (
          <PatientRegistration
            patients={patients}
            selectedPatientId={selectedPatientId}
            registerPatient={registerPatient}
            setSelectedPatientId={setSelectedPatientId}
          />
        )}
        {activePage === 'SelectDoctorServices' && (
          <SelectDoctorServices doctors={doctors} serviceCatalog={serviceCatalog} createVisit={createVisit} selectedPatient={selectedPatient} />
        )}
        {activePage === 'InvoiceCreate' && <InvoiceCreate visit={selectedVisit} patient={selectedPatient} doctors={doctors} />}
        {activePage === 'RegisterPayment' && <RegisterPayment visit={selectedVisit} registerPayment={registerPayment} />}
        {activePage === 'WaitingScreen' && (
          <WaitingScreen
            visits={waitingVisits}
            patients={patients}
            doctors={doctors}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
          />
        )}
        {activePage === 'DoctorDashboard' && (
          <DoctorDashboard
            visits={assignedVisits}
            patients={patients}
            doctors={doctors}
            doctorFilter={doctorFilter}
            setDoctorFilter={setDoctorFilter}
            startConsultation={startConsultation}
          />
        )}
        {activePage === 'ConsultationScreen' && (
          <ConsultationScreen visit={selectedVisit} patients={patients} doctors={doctors} setActivePage={setActivePage} />
        )}
        {activePage === 'AddPrescription' && <AddPrescription visit={selectedVisit} savePrescription={savePrescription} />}
        {activePage === 'AddExtraServices' && <AddExtraServices visit={selectedVisit} addExtraService={addExtraService} serviceCatalog={serviceCatalog} />}
        {activePage === 'PatientProfile' && <PatientProfile patient={selectedPatient} visits={visits.filter((v) => v.patientId === selectedPatientId)} doctors={doctors} />}
      </main>
    </div>
  );
}

function PatientRegistration({ patients, selectedPatientId, registerPatient, setSelectedPatientId }) {
  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: 'Female' });

  return (
    <section className="grid two">
      <article className="card">
        <h3>PatientRegistration</h3>
        <div className="tabs">
          <button className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>
            Existing
          </button>
          <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
            New
          </button>
        </div>

        {mode === 'existing' ? (
          <>
            <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => registerPatient({ mode: 'existing', patientId: selectedPatientId })}>
              Continue with existing
            </button>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              registerPatient({ mode: 'new', ...form, age: Number(form.age) });
            }}
          >
            <input placeholder="Full name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <input placeholder="Age" type="number" value={form.age} onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))} />
            <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
              <option>Female</option>
              <option>Male</option>
            </select>
            <button className="btn">Register patient</button>
          </form>
        )}
      </article>
      <article className="card">
        <h4>Patients</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function SelectDoctorServices({ doctors, serviceCatalog, createVisit, selectedPatient }) {
  const [doctorId, setDoctorId] = useState(doctors[0].id);
  const [selectedServices, setSelectedServices] = useState([serviceCatalog[0].id]);

  const services = selectedServices.map((id) => serviceCatalog.find((s) => s.id === id));
  const total = services.reduce((sum, s) => sum + s.price, 0);

  return (
    <section className="grid two">
      <article className="card stack">
        <h3>SelectDoctorServices</h3>
        <p>Patient: {selectedPatient?.name || 'Select a patient first'}</p>
        <label>Doctor</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} - {d.specialty}
            </option>
          ))}
        </select>

        <label>Services</label>
        <div className="service-list">
          {serviceCatalog.map((service) => (
            <label key={service.id} className="check-row">
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={(e) => {
                  setSelectedServices((prev) =>
                    e.target.checked ? [...prev, service.id] : prev.filter((id) => id !== service.id),
                  );
                }}
              />
              {service.name} - ${service.price}
            </label>
          ))}
        </div>
        <button className="btn" onClick={() => createVisit({ doctorId, services })}>
          Create visit (${total})
        </button>
      </article>
      <article className="card">
        <h4>Flow Check</h4>
        <ul>
          <li>Visit linked to patient + doctor + services</li>
          <li>Invoice auto-created from selected services</li>
          <li>Payment page can now register first payment</li>
        </ul>
      </article>
    </section>
  );
}

function InvoiceCreate({ visit, patient, doctors }) {
  if (!visit) return <article className="card">No visit yet.</article>;
  const doctor = doctors.find((d) => d.id === visit.doctorId);
  return (
    <article className="card">
      <h3>InvoiceCreate</h3>
      <p>Invoice #{visit.invoice.id}</p>
      <p>
        Patient: {patient?.name} · Doctor: {doctor?.name}
      </p>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {visit.invoice.lines.map((line, idx) => (
            <tr key={`${line.id}-${idx}`}>
              <td>{line.name}</td>
              <td>${line.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Total: ${visit.invoice.total}</p>
      <p>Paid: ${visit.invoice.totalPaid}</p>
      <p>Balance: ${visit.invoice.total - visit.invoice.totalPaid}</p>
    </article>
  );
}

function RegisterPayment({ visit, registerPayment }) {
  const [amount, setAmount] = useState(0);
  if (!visit) return <article className="card">No invoice to pay.</article>;
  const remaining = visit.invoice.total - visit.invoice.totalPaid;
  return (
    <article className="card stack">
      <h3>RegisterPayment</h3>
      <p>Invoice: {visit.invoice.id}</p>
      <p>Remaining: ${remaining}</p>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button className="btn" onClick={() => registerPayment(visit.id, amount)}>
        Register payment
      </button>
      <p>{remaining <= 0 ? 'Fully paid' : 'Any payment will move patient to waiting screen.'}</p>
    </article>
  );
}

function WaitingScreen({ visits, patients, doctors, queueFilter, setQueueFilter }) {
  return (
    <article className="card">
      <h3>WaitingScreen</h3>
      <div className="toolbar">
        <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="waiting">Waiting</option>
          <option value="in_consultation">In Consultation</option>
          <option value="done">Done</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id}>
              <td>{patients.find((p) => p.id === visit.patientId)?.name}</td>
              <td>{doctors.find((d) => d.id === visit.doctorId)?.name}</td>
              <td>{statusBadge(visit.queueStatus, labels.en)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function DoctorDashboard({ visits, patients, doctors, doctorFilter, setDoctorFilter, startConsultation }) {
  return (
    <article className="card">
      <h3>DoctorDashboard</h3>
      <div className="toolbar">
        <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
          <option value="all">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Patient</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visits
            .filter((v) => v.queueStatus === 'waiting' || v.queueStatus === 'in_consultation')
            .map((visit) => (
              <tr key={visit.id}>
                <td>{doctors.find((d) => d.id === visit.doctorId)?.name}</td>
                <td>{patients.find((p) => p.id === visit.patientId)?.name}</td>
                <td>{statusBadge(visit.queueStatus, labels.en)}</td>
                <td>
                  <button className="btn small" onClick={() => startConsultation(visit.id)}>
                    Start
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </article>
  );
}

function ConsultationScreen({ visit, patients, doctors, setActivePage }) {
  if (!visit) return <article className="card">No active consultation.</article>;
  return (
    <article className="card stack">
      <h3>ConsultationScreen</h3>
      <p>Patient: {patients.find((p) => p.id === visit.patientId)?.name}</p>
      <p>Doctor: {doctors.find((d) => d.id === visit.doctorId)?.name}</p>
      <div className="actions">
        <button className="btn" onClick={() => setActivePage('AddPrescription')}>
          Add prescription
        </button>
        <button className="btn secondary" onClick={() => setActivePage('AddExtraServices')}>
          Add extra service
        </button>
      </div>
      <p>Consultation notes tab (mock): vitals stable, mild cough, requires medication + optional lab.</p>
    </article>
  );
}

function AddPrescription({ visit, savePrescription }) {
  const [medicine, setMedicine] = useState('Amoxicillin 500mg');
  const [instructions, setInstructions] = useState('Twice daily after meals for 5 days');
  if (!visit) return <article className="card">No consultation selected.</article>;
  return (
    <article className="card stack">
      <h3>AddPrescription</h3>
      <input value={medicine} onChange={(e) => setMedicine(e.target.value)} />
      <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
      <button className="btn" onClick={() => savePrescription(visit.id, { medicine, instructions })}>
        Save to patient profile
      </button>
    </article>
  );
}

function AddExtraServices({ visit, addExtraService, serviceCatalog }) {
  const [serviceId, setServiceId] = useState(serviceCatalog[1].id);
  const [showModal, setShowModal] = useState(false);
  if (!visit) return <article className="card">No visit selected.</article>;
  const remaining = visit.invoice.total - visit.invoice.totalPaid;
  return (
    <article className="card stack">
      <h3>AddExtraServices</h3>
      <p>Current balance before extra service: ${remaining}</p>
      <div className="toolbar">
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {serviceCatalog.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} - ${s.price}
            </option>
          ))}
        </select>
        <button className="btn" onClick={() => setShowModal(true)}>
          Add to invoice
        </button>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-body card">
            <h4>Confirm extra service</h4>
            <p>This updates the same invoice and may create pending amount at reception.</p>
            <button
              className="btn"
              onClick={() => {
                const service = serviceCatalog.find((s) => s.id === serviceId);
                addExtraService(visit.id, service);
                setShowModal(false);
              }}
            >
              Confirm
            </button>
            <button className="btn secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PatientProfile({ patient, visits, doctors }) {
  if (!patient) return <article className="card">No patient selected.</article>;
  return (
    <section className="grid two">
      <article className="card stack">
        <h3>PatientProfile</h3>
        <p>
          {patient.name} · {patient.gender} · {patient.age}
        </p>
        <h4>Prescriptions</h4>
        <ul>
          {patient.prescriptions.length === 0 && <li>No prescriptions yet</li>}
          {patient.prescriptions.map((rx, idx) => (
            <li key={`${rx.visitId}-${idx}`}>
              {rx.date}: {rx.medicine} ({rx.instructions})
            </li>
          ))}
        </ul>
      </article>
      <article className="card">
        <h4>Visit History & Pending Payment</h4>
        <table>
          <thead>
            <tr>
              <th>Visit</th>
              <th>Doctor</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.id}</td>
                <td>{doctors.find((d) => d.id === visit.doctorId)?.name}</td>
                <td>${visit.invoice.total}</td>
                <td>${visit.invoice.totalPaid}</td>
                <td>${visit.invoice.total - visit.invoice.totalPaid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
