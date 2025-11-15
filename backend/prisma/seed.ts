

// FIX: Replaced import with require to work around potential module resolution or type generation issues.
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// This object is copied from the frontend to avoid a direct dependency.
// In a real monorepo, this would be shared.
const DEFAULT_PERMISSIONS = {
  'Admin': {
    "Dashboard": { "read": true, "create": true, "update": true, "delete": true },
    "Contacts": { "read": true, "create": true, "update": true, "delete": true },
    "LMS": { "read": true, "create": true, "update": true, "delete": true },
    "CRM": { "read": true, "create": true, "update": true, "delete": true },
    "Calendar": { "read": true, "create": true, "update": true, "delete": true },
    "Discuss": { "read": true, "create": true, "update": true, "delete": true },
    "Accounting": { "read": true, "create": true, "update": true, "delete": true },
    "Sales": { "read": true, "create": true, "update": true, "delete": true },
    "Inventory": { "read": true, "create": true, "update": true, "delete": true },
    "Manufacturing": { "read": true, "create": true, "update": true, "delete": true },
    "Website": { "read": true, "create": true, "update": true, "delete": true },
    "Point of Sale": { "read": true, "create": true, "update": true, "delete": true },
    "Marketing": { "read": true, "create": true, "update": true, "delete": true },
    "To-do": { "read": true, "create": true, "update": true, "delete": true },
    "Reception": { "read": true, "create": true, "update": true, "delete": true },
    "Settings": { "read": true, "create": true, "update": true, "delete": true },
    "Access Control": { "read": true, "create": true, "update": true, "delete": true }
  },
  'Employee': {
    "Contacts": { "read": true, "create": true, "update": true, "delete": true },
    "CRM": { "read": true, "create": true, "update": true, "delete": true },
    "Calendar": { "read": true, "create": true, "update": true, "delete": true },
    "Discuss": { "read": true, "create": true, "update": true, "delete": true },
    "To-do": { "read": true, "create": true, "update": true, "delete": true },
    "Reception": { "read": true, "create": true, "update": true, "delete": true },
    "Sales": { "read": true, "create": true, "update": true, "delete": true },
    "Marketing": { "read": true, "create": true, "update": true, "delete": true },
    "LMS": { "read": true, "create": true, "update": true, "delete": true },
    "Dashboard": { "read": true },
    "Accounting": { "read": true },
    "Inventory": { "read": true },
    "Manufacturing": { "read": true },
    "Website": { "read": true },
    "Point of Sale": { "read": true }
  },
  'Student': {
    'LMS': { "read": true },
  },
};

async function main() {
    console.log('Start seeding ...');

    const adminPassword = await bcrypt.hash('Alice@123', 10);
    const empPassword = await bcrypt.hash('Bob@123', 10);
    const student1Password = await bcrypt.hash('Charlie@123', 10);
    const student2Password = await bcrypt.hash('Diana@123', 10);

    // --- Users ---
    const alice = await prisma.user.upsert({
        where: { email: 'alice.admin@lyceum.academy' },
        update: {},
        create: {
            name: 'Alice Admin',
            email: 'alice.admin@lyceum.academy',
            password: adminPassword,
            role: 'Admin',
            permissions: DEFAULT_PERMISSIONS.Admin as any,
        },
    });

    const bob = await prisma.user.upsert({
        where: { email: 'bob.employee@lyceum.academy' },
        update: {},
        create: {
            name: 'Bob Employee',
            email: 'bob.employee@lyceum.academy',
            password: empPassword,
            role: 'Employee',
            permissions: DEFAULT_PERMISSIONS.Employee as any,
        },
    });

    const charlie = await prisma.user.upsert({
        where: { email: 'charlie.student@lyceum.academy' },
        update: {},
        create: {
            name: 'Charlie Student',
            email: 'charlie.student@lyceum.academy',
            password: student1Password,
            role: 'Student',
        },
    });

    const diana = await prisma.user.upsert({
        where: { email: 'diana.student@lyceum.academy' },
        update: {},
        create: {
            name: 'Diana Student',
            email: 'diana.student@lyceum.academy',
            password: student2Password,
            role: 'Student',
        },
    });

    console.log(`Created/found users: ${alice.email}, ${bob.email}, ${charlie.email}, ${diana.email}`);

    // --- Contacts ---
    await prisma.contact.createMany({
        data: [
            { userId: charlie.id, name: 'Charlie Student', email: 'charlie.student@lyceum.academy', contactId: 'LA202401', department: 'Computer Science', major: 'AI & Machine Learning', phone: '555-0101' },
            { userId: diana.id, name: 'Diana Student', email: 'diana.student@lyceum.academy', contactId: 'LA202402', department: 'Business Administration', major: 'Marketing', phone: '555-0102' },
            { name: 'Ethan Prospective', email: 'ethan.p@example.com', contactId: 'LA202403', department: 'Arts & Humanities', major: 'History', phone: '555-0103', fileStatus: 'In progress' },
            { name: 'Fiona Applicant', email: 'fiona.a@example.com', contactId: 'LA202404', department: 'Engineering', major: 'Mechanical Engineering', phone: '555-0104', fileStatus: 'On hold' },
            { name: 'George Alumni', email: 'george.alumni@example.com', contactId: 'LA202115', department: 'Computer Science', major: 'Software Development', phone: '555-0105', fileStatus: 'Closed' },
        ],
        skipDuplicates: true,
    });
    console.log(`Created/found contacts.`);
    
    // --- CRM Leads ---
    await prisma.crmLead.createMany({
        data: [
            { title: 'Corporate Training Program', company: 'Innovate Corp', value: 75000, contact: 'Ms. Smith', stage: 'Proposal', assignedTo: 'Alice Admin', createdAt: new Date() },
            { title: 'Fall Semester Admissions Campaign', company: 'Marketing Solutions Ltd.', value: 50000, contact: 'Mr. Jones', stage: 'Qualified', assignedTo: 'Bob Employee', createdAt: new Date() },
            { title: 'New Engineering Partnership', company: 'BuildIt Inc.', value: 120000, contact: 'Dr. Evelyn Reed', stage: 'Won', assignedTo: 'Alice Admin', createdAt: new Date() },
            { title: 'Summer Workshop Series', company: 'LearnFast Tutors', value: 25000, contact: 'Sam Taylor', stage: 'New', assignedTo: 'Bob Employee', createdAt: new Date() },
            { title: 'Website Redesign', company: 'Creative Designs', value: 15000, contact: 'Paul Walker', stage: 'Lost', assignedTo: 'Bob Employee', createdAt: new Date() },
        ],
        skipDuplicates: true,
    });
    console.log(`Created/found CRM leads.`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
