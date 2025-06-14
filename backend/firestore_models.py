from datetime import datetime, date, timedelta
import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import List, Dict, Optional

# Firebase初期化
if not firebase_admin._apps:
    if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
        cred = credentials.ApplicationDefault()
    else:
        # ローカル開発用
        cred = credentials.Certificate('serviceAccountKey.json')
    
    firebase_admin.initialize_app(cred)

db = firestore.client()

def init_db():
    """Firestoreの初期化（特に必要なし）"""
    pass

def add_pomodoro() -> str:
    """ポモドーロを追加"""
    doc_ref = db.collection('pomodoros').document()
    doc_ref.set({
        'start_at': firestore.SERVER_TIMESTAMP,
        'end_at': None,
        'completed': False,
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id

def update_pomodoro(pomodoro_id: str, end_time: datetime, completed: bool = False):
    """ポモドーロを更新"""
    doc_ref = db.collection('pomodoros').document(pomodoro_id)
    doc_ref.update({
        'end_at': end_time,
        'completed': completed,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def add_task(name: str, category_id: Optional[str] = None, template_id: Optional[str] = None) -> str:
    """タスクを追加"""
    doc_ref = db.collection('tasks').document()
    doc_ref.set({
        'name': name,
        'category_id': category_id,
        'template_id': template_id,
        'start_at': firestore.SERVER_TIMESTAMP,
        'end_at': None,
        'status': 'active',
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id

def update_task(task_id: str, end_time: datetime, status: str = 'completed'):
    """タスクを更新"""
    doc_ref = db.collection('tasks').document(task_id)
    doc_ref.update({
        'end_at': end_time,
        'status': status,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def add_note(task_id: str, note: str) -> str:
    """メモを追加"""
    doc_ref = db.collection('notes').document()
    doc_ref.set({
        'task_id': task_id,
        'note': note,
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id

def get_today_pomodoros() -> List[Dict]:
    """今日のポモドーロを取得"""
    today_start = datetime.combine(date.today(), datetime.min.time())
    
    pomodoros = db.collection('pomodoros')\
        .where('start_at', '>=', today_start)\
        .order_by('start_at', direction=firestore.Query.DESCENDING)\
        .stream()
    
    results = []
    for pomo in pomodoros:
        data = pomo.to_dict()
        data['id'] = pomo.id
        # Timestampを文字列に変換
        if data.get('start_at'):
            data['start_at'] = data['start_at'].strftime('%Y-%m-%d %H:%M:%S.%f')
        if data.get('end_at'):
            data['end_at'] = data['end_at'].strftime('%Y-%m-%d %H:%M:%S.%f')
        results.append(data)
    
    return results

def get_today_tasks() -> List[Dict]:
    """今日のタスクを取得"""
    today_start = datetime.combine(date.today(), datetime.min.time())
    
    tasks = db.collection('tasks')\
        .where('start_at', '>=', today_start)\
        .order_by('start_at', direction=firestore.Query.DESCENDING)\
        .stream()
    
    results = []
    for task in tasks:
        data = task.to_dict()
        data['id'] = task.id
        # Timestampを文字列に変換
        if data.get('start_at'):
            data['start_at'] = data['start_at'].strftime('%Y-%m-%d %H:%M:%S.%f')
        if data.get('end_at'):
            data['end_at'] = data['end_at'].strftime('%Y-%m-%d %H:%M:%S.%f')
        results.append(data)
    
    return results

def get_task_notes(task_id: str) -> List[Dict]:
    """タスクのメモを取得"""
    notes = db.collection('notes')\
        .where('task_id', '==', task_id)\
        .order_by('created_at')\
        .stream()
    
    results = []
    for note in notes:
        data = note.to_dict()
        data['id'] = note.id
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        results.append(data)
    
    return results

def get_active_task() -> Optional[Dict]:
    """アクティブなタスクを取得"""
    tasks = db.collection('tasks')\
        .where('status', '==', 'active')\
        .limit(1)\
        .stream()
    
    for task in tasks:
        data = task.to_dict()
        data['id'] = task.id
        if data.get('start_at'):
            data['start_at'] = data['start_at'].strftime('%Y-%m-%d %H:%M:%S.%f')
        return data
    
    return None

def add_category(name: str, color: str = '#3b82f6') -> str:
    """カテゴリを追加"""
    doc_ref = db.collection('categories').document()
    doc_ref.set({
        'name': name,
        'color': color,
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id

def get_categories() -> List[Dict]:
    """カテゴリ一覧を取得"""
    categories = db.collection('categories')\
        .order_by('created_at')\
        .stream()
    
    results = []
    for cat in categories:
        data = cat.to_dict()
        data['id'] = cat.id
        results.append(data)
    
    return results

def add_task_template(name: str, category_id: Optional[str] = None) -> str:
    """タスクテンプレートを追加"""
    doc_ref = db.collection('task_templates').document()
    doc_ref.set({
        'name': name,
        'category_id': category_id,
        'is_active': True,
        'created_at': firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id

def get_task_templates() -> List[Dict]:
    """タスクテンプレート一覧を取得"""
    templates = db.collection('task_templates')\
        .where('is_active', '==', True)\
        .order_by('created_at')\
        .stream()
    
    results = []
    for template in templates:
        data = template.to_dict()
        data['id'] = template.id
        results.append(data)
    
    return results

def deactivate_task_template(template_id: str):
    """タスクテンプレートを無効化"""
    doc_ref = db.collection('task_templates').document(template_id)
    doc_ref.update({
        'is_active': False,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def get_pomodoros_by_date(target_date: date) -> List[Dict]:
    """指定日のポモドーロを取得"""
    start_time = datetime.combine(target_date, datetime.min.time())
    end_time = start_time + timedelta(days=1)
    
    pomodoros = db.collection('pomodoros')\
        .where('start_at', '>=', start_time)\
        .where('start_at', '<', end_time)\
        .order_by('start_at')\
        .stream()
    
    results = []
    for pomo in pomodoros:
        data = pomo.to_dict()
        data['id'] = pomo.id
        if data.get('start_at'):
            data['start_at'] = data['start_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('end_at'):
            data['end_at'] = data['end_at'].strftime('%Y-%m-%d %H:%M:%S')
        results.append(data)
    
    return results

def get_tasks_by_date(target_date: date) -> List[Dict]:
    """指定日のタスクを取得"""
    start_time = datetime.combine(target_date, datetime.min.time())
    end_time = start_time + timedelta(days=1)
    
    tasks = db.collection('tasks')\
        .where('start_at', '>=', start_time)\
        .where('start_at', '<', end_time)\
        .order_by('start_at')\
        .stream()
    
    results = []
    for task in tasks:
        data = task.to_dict()
        data['id'] = task.id
        if data.get('start_at'):
            data['start_at'] = data['start_at'].strftime('%Y-%m-%d %H:%M:%S')
        if data.get('end_at'):
            data['end_at'] = data['end_at'].strftime('%Y-%m-%d %H:%M:%S')
        results.append(data)
    
    return results

def get_all_notes_by_date(target_date: date) -> List[Dict]:
    """指定日のメモを取得"""
    start_time = datetime.combine(target_date, datetime.min.time())
    end_time = start_time + timedelta(days=1)
    
    notes = db.collection('notes')\
        .where('created_at', '>=', start_time)\
        .where('created_at', '<', end_time)\
        .order_by('created_at')\
        .stream()
    
    results = []
    for note in notes:
        data = note.to_dict()
        data['id'] = note.id
        if data.get('created_at'):
            data['created_at'] = data['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        results.append(data)
    
    return results