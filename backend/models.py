import sqlite3
from datetime import datetime, date

DATABASE = 'pomo_hub.db'

def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """データベースを初期化"""
    conn = get_db_connection()
    
    # categoriesテーブル（カテゴリ管理）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # pomodorosテーブル（ポモドーロタイマー専用）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS pomodoros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_at TIMESTAMP NOT NULL,
            end_at TIMESTAMP,
            completed BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # task_templatesテーブル（タスクテンプレート）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS task_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    ''')
    
    # tasksテーブル（実際の作業記録）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_id INTEGER,
            category_id INTEGER,
            name TEXT NOT NULL,
            start_at TIMESTAMP NOT NULL,
            end_at TIMESTAMP,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (template_id) REFERENCES task_templates (id),
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    ''')
    
    # notesテーブル（タスクに紐づくメモ）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks (id)
        )
    ''')
    
    # 既存のテーブルを削除（開発中のみ）
    try:
        conn.execute('DROP TABLE IF EXISTS sessions')
    except:
        pass
    
    conn.commit()
    conn.close()

def add_pomodoro():
    """新しいポモドーロを開始"""
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO pomodoros (start_at) VALUES (?)',
        (datetime.now(),)
    )
    pomodoro_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pomodoro_id

def add_category(name, color='#3b82f6'):
    """新しいカテゴリを追加"""
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO categories (name, color) VALUES (?, ?)',
            (name, color)
        )
        category_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return category_id
    except sqlite3.IntegrityError:
        # 既に存在する場合は既存のIDを返す
        existing = conn.execute(
            'SELECT id FROM categories WHERE name = ?',
            (name,)
        ).fetchone()
        conn.close()
        return existing[0] if existing else None

def get_categories():
    """全カテゴリを取得"""
    conn = get_db_connection()
    categories = conn.execute(
        'SELECT id, name, color FROM categories ORDER BY name'
    ).fetchall()
    conn.close()
    return categories

def add_task_template(name, category_id=None):
    """新しいタスクテンプレートを追加"""
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO task_templates (category_id, name) VALUES (?, ?)',
        (category_id, name)
    )
    template_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return template_id

def get_task_templates():
    """アクティブなタスクテンプレート一覧を取得"""
    conn = get_db_connection()
    templates = conn.execute(
        '''SELECT t.id, t.category_id, t.name, t.created_at,
                  c.name as category_name, c.color as category_color
           FROM task_templates t
           LEFT JOIN categories c ON t.category_id = c.id
           WHERE t.is_active = TRUE
           ORDER BY t.created_at DESC'''
    ).fetchall()
    conn.close()
    return templates

def deactivate_task_template(template_id):
    """タスクテンプレートを無効化"""
    conn = get_db_connection()
    conn.execute(
        'UPDATE task_templates SET is_active = FALSE WHERE id = ?',
        (template_id,)
    )
    conn.commit()
    conn.close()

def add_task(task_name, category_id=None, template_id=None):
    """新しいタスクを開始"""
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO tasks (template_id, category_id, name, start_at) VALUES (?, ?, ?, ?)',
        (template_id, category_id, task_name, datetime.now())
    )
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id

def update_pomodoro(pomodoro_id, end_time, completed=True):
    """ポモドーロの終了時刻を更新"""
    conn = get_db_connection()
    conn.execute(
        'UPDATE pomodoros SET end_at = ?, completed = ? WHERE id = ?',
        (end_time, completed, pomodoro_id)
    )
    conn.commit()
    conn.close()

def update_task(task_id, end_time):
    """タスクの終了時刻を更新"""
    conn = get_db_connection()
    conn.execute(
        'UPDATE tasks SET end_at = ?, status = ? WHERE id = ?',
        (end_time, 'completed', task_id)
    )
    conn.commit()
    conn.close()

def add_note(task_id, note_text):
    """タスクにメモを追加"""
    conn = get_db_connection()
    cursor = conn.execute(
        'INSERT INTO notes (task_id, body) VALUES (?, ?)',
        (task_id, note_text)
    )
    note_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return note_id

def get_today_pomodoros():
    """今日のポモドーロ一覧を取得"""
    conn = get_db_connection()
    today = date.today()
    pomodoros = conn.execute(
        '''SELECT id, start_at, end_at, completed 
           FROM pomodoros 
           WHERE date(start_at) = ? 
           ORDER BY start_at DESC''',
        (today,)
    ).fetchall()
    conn.close()
    return pomodoros

def get_today_tasks():
    """今日のタスク一覧を取得"""
    conn = get_db_connection()
    today = date.today()
    tasks = conn.execute(
        '''SELECT t.id, t.category_id, t.name, t.start_at, t.end_at, t.status,
                  c.name as category_name, c.color as category_color
           FROM tasks t
           LEFT JOIN categories c ON t.category_id = c.id
           WHERE date(t.start_at) = ? 
           ORDER BY t.start_at DESC''',
        (today,)
    ).fetchall()
    conn.close()
    return tasks

def get_active_task():
    """現在進行中のタスクを取得"""
    conn = get_db_connection()
    task = conn.execute(
        '''SELECT t.id, t.category_id, t.name, t.start_at,
                  c.name as category_name, c.color as category_color
           FROM tasks t
           LEFT JOIN categories c ON t.category_id = c.id
           WHERE t.status = 'active' 
           ORDER BY t.start_at DESC 
           LIMIT 1'''
    ).fetchone()
    conn.close()
    return task

def get_task_notes(task_id):
    """指定タスクのメモ一覧を取得"""
    conn = get_db_connection()
    notes = conn.execute(
        '''SELECT id, body, created_at 
           FROM notes 
           WHERE task_id = ? 
           ORDER BY created_at ASC''',
        (task_id,)
    ).fetchall()
    conn.close()
    return [dict(note) for note in notes]

def get_pomodoros_by_date(target_date):
    """指定日のポモドーロ一覧を取得"""
    conn = get_db_connection()
    pomodoros = conn.execute(
        '''SELECT id, start_at, end_at, completed 
           FROM pomodoros 
           WHERE date(start_at) = ? 
           ORDER BY start_at ASC''',
        (target_date,)
    ).fetchall()
    conn.close()
    return pomodoros

def get_tasks_by_date(target_date):
    """指定日のタスク一覧を取得"""
    conn = get_db_connection()
    tasks = conn.execute(
        '''SELECT id, name, start_at, end_at, status 
           FROM tasks 
           WHERE date(start_at) = ? 
           ORDER BY start_at ASC''',
        (target_date,)
    ).fetchall()
    conn.close()
    return tasks

def get_all_notes_by_date(target_date):
    """指定日の全メモを取得"""
    conn = get_db_connection()
    notes = conn.execute(
        '''SELECT n.id, n.task_id, n.body, n.created_at, t.name
           FROM notes n
           JOIN tasks t ON n.task_id = t.id
           WHERE date(t.start_at) = ?
           ORDER BY n.created_at ASC''',
        (target_date,)
    ).fetchall()
    conn.close()
    return notes