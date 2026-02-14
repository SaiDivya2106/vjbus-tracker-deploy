// Delete app by id
export async function deleteApp(id) {
    const db = await openDb();
    await db.run('DELETE FROM apps WHERE id = ?', id);
}
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDb() {
    return open({
        filename: path.join(process.cwd(), 'superapp.db'),
        driver: sqlite3.Database
    });
}

export async function getApps() {
    const db = await openDb();
    return db.all('SELECT * FROM apps');
}

export async function setAppStatus(id, isenabled) {
    const db = await openDb();
    await db.run('UPDATE apps SET isenabled = ? WHERE id = ?', isenabled ? 1 : 0, id);
}

export async function addApp(app) {
    const db = await openDb();
    await db.run(
        `INSERT INTO apps (id, name, description, url, icon, category, color, gradient, newTab, isenabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        app.id,
        app.name,
        app.description || '',
        app.url,
        app.icon || '',
        app.category || '',
        app.color || '',
        app.gradient || '',
        app.newTab ? 1 : 0,
        app.isenabled !== undefined ? (app.isenabled ? 1 : 0) : 1
    );
}

export async function isAdmin(email) {
    const adminEmails = process.env.VITE_ADMIN_EMAIL.split(',').map(e => e.trim());
    console.log('Admin Emails:', adminEmails);
    return adminEmails.includes(email);
}

export async function updateApp(app) {
    const db = await openDb();
    await db.run(
        `UPDATE apps 
     SET name = ?, description = ?, url = ?, icon = ?, category = ?, color = ?, gradient = ?, newTab = ?, isenabled = ?
     WHERE id = ?`,
        app.name,
        app.description || '',
        app.url,
        app.icon || '',
        app.category || '',
        app.color || '',
        app.gradient || '',
        app.newTab ? 1 : 0,
        app.isenabled !== undefined ? (app.isenabled ? 1 : 0) : 1,
        app.id
    );
}
