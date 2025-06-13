from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import json
from models import (init_db, add_pomodoro, update_pomodoro, add_task, update_task, 
                    add_note, get_today_pomodoros, get_today_tasks, get_task_notes, get_active_task,
                    add_category, get_categories, add_task_template, get_task_templates, deactivate_task_template)

app = Flask(__name__)
CORS(app)

# データベースの初期化
init_db()

# APSchedulerの設定
scheduler = BackgroundScheduler()
scheduler.start()

# Discord Webhook URL
DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL', '')

@app.route('/api/export/data', methods=['GET'])
def export_data():
    """データエクスポート"""
    export_format = request.args.get('format', 'json')  # json, csv, markdown
    export_date = request.args.get('date', None)  # YYYY-MM-DD形式
    
    try:
        from models import get_pomodoros_by_date, get_tasks_by_date, get_all_notes_by_date
        from datetime import date
        
        target_date = date.fromisoformat(export_date) if export_date else date.today()
        
        # データ取得
        pomodoros = get_pomodoros_by_date(target_date)
        tasks = get_tasks_by_date(target_date)
        notes = get_all_notes_by_date(target_date)
        
        if export_format == 'json':
            return jsonify({
                'success': True,
                'date': str(target_date),
                'data': {
                    'pomodoros': [dict(p) for p in pomodoros],
                    'tasks': [dict(t) for t in tasks],
                    'notes': [dict(n) for n in notes]
                }
            })
        
        elif export_format == 'csv':
            import csv
            import io
            
            output = io.StringIO()
            
            # ポモドーロデータのみ
            output.write("ID,開始時刻,終了時刻,完了\n")
            for p in pomodoros:
                output.write(f"{p['id']},{p['start_at']},{p['end_at'] or '未完了'},{p['completed']}\n")
            
            return output.getvalue(), 200, {'Content-Type': 'text/csv; charset=utf-8'}
        
        elif export_format == 'markdown':
            md_content = f"# 作業記録 - {target_date}\n\n"
            
            md_content += "## ポモドーロ記録\n\n"
            if pomodoros:
                for p in pomodoros:
                    duration = "25分完了" if p['completed'] else "未完了"
                    md_content += f"- {p['start_at'][:16]} - {duration}\n"
            else:
                md_content += "記録なし\n"
            
            md_content += "\n## タスク記録\n\n"
            if tasks:
                for t in tasks:
                    status = "完了" if t['status'] == 'completed' else "進行中"
                    md_content += f"- **{t['name']}** ({status})\n"
                    md_content += f"  - 開始: {t['start_at'][:16]}\n"
                    if t['end_at']:
                        md_content += f"  - 終了: {t['end_at'][:16]}\n"
            else:
                md_content += "記録なし\n"
            
            return md_content, 200, {'Content-Type': 'text/markdown; charset=utf-8'}
        
        else:
            return jsonify({'success': False, 'message': '無効なフォーマットです'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def send_discord_notification(message):
    """Discord Webhookに通知を送信"""
    if not DISCORD_WEBHOOK_URL:
        return
    
    try:
        payload = {
            'content': message,
            'username': 'PomoHub'
        }
        requests.post(DISCORD_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"Discord通知エラー: {e}")

def pomodoro_finished_callback(pomodoro_id):
    """ポモドーロ終了時のコールバック"""
    try:
        # ポモドーロ終了時刻を更新
        update_pomodoro(pomodoro_id, datetime.now(), completed=True)
        
        # Discord通知
        message = '🍅 ポモドーロタイマー終了！お疲れ様でした！'
        send_discord_notification(message)
    except Exception as e:
        print(f"ポモドーロ終了処理エラー: {e}")

# ポモドーロタイマーのエンドポイント
@app.route('/api/pomodoro/start', methods=['POST'])
def start_pomodoro():
    """ポモドーロタイマー開始"""
    try:
        # ポモドーロ開始
        pomodoro_id = add_pomodoro()
        
        # 25分後の終了時刻
        end_time = datetime.now() + timedelta(minutes=25)
        
        # APSchedulerでタイマー終了をスケジュール
        scheduler.add_job(
            pomodoro_finished_callback,
            'date',
            run_date=end_time,
            args=[pomodoro_id],
            id=f'pomodoro_{pomodoro_id}'
        )
        
        # Discord通知
        send_discord_notification('🍅 ポモドーロタイマー開始！')
        
        return jsonify({
            'success': True,
            'pomodoro_id': pomodoro_id,
            'end_time': end_time.isoformat(),
            'duration_minutes': 25
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pomodoro/stop', methods=['POST'])
def stop_pomodoro():
    """ポモドーロタイマー停止"""
    try:
        data = request.get_json()
        pomodoro_id = data.get('pomodoro_id')
        
        if not pomodoro_id:
            return jsonify({'success': False, 'error': 'pomodoro_id is required'}), 400
        
        # ポモドーロ終了
        update_pomodoro(pomodoro_id, datetime.now(), completed=False)
        
        # スケジュールされたタイマーをキャンセル
        try:
            scheduler.remove_job(f'pomodoro_{pomodoro_id}')
        except:
            pass  # ジョブが存在しない場合は無視
        
        # Discord通知
        send_discord_notification('⏹️ ポモドーロタイマーを停止しました')
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# タスク管理のエンドポイント
@app.route('/api/categories', methods=['GET'])
def get_categories_api():
    """カテゴリ一覧取得"""
    try:
        categories = get_categories()
        return jsonify({
            'success': True,
            'categories': [dict(cat) for cat in categories]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def add_category_api():
    """カテゴリ追加"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        color = data.get('color', '#3b82f6')
        
        if not name:
            return jsonify({'success': False, 'error': 'category name is required'}), 400
        
        category_id = add_category(name, color)
        
        return jsonify({
            'success': True,
            'category_id': category_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task-templates', methods=['GET'])
def get_task_templates_api():
    """タスクテンプレート一覧取得"""
    try:
        templates = get_task_templates()
        return jsonify({
            'success': True,
            'templates': [dict(template) for template in templates]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task-templates', methods=['POST'])
def add_task_template_api():
    """タスクテンプレート追加"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        category_id = data.get('category_id')
        
        if not name:
            return jsonify({'success': False, 'error': 'task name is required'}), 400
        
        template_id = add_task_template(name, category_id)
        
        return jsonify({
            'success': True,
            'template_id': template_id
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task-templates/<int:template_id>', methods=['DELETE'])
def delete_task_template_api(template_id):
    """タスクテンプレート削除"""
    try:
        deactivate_task_template(template_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task/start', methods=['POST'])
def start_task():
    """タスク開始"""
    try:
        data = request.get_json()
        task_name = data.get('task', '')
        category_id = data.get('category_id')
        template_id = data.get('template_id')
        
        if not task_name:
            return jsonify({'success': False, 'error': 'task name is required'}), 400
        
        # 現在アクティブなタスクがあれば終了する
        active_task = get_active_task()
        if active_task:
            update_task(active_task['id'], datetime.now())
        
        # 新しいタスク開始
        task_id = add_task(task_name, category_id, template_id)
        
        # Discord通知
        message = f'📋 タスク開始: {task_name}'
        send_discord_notification(message)
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'task_name': task_name,
            'start_time': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task/stop', methods=['POST'])
def stop_task():
    """タスク終了"""
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        
        if not task_id:
            # アクティブなタスクを取得
            active_task = get_active_task()
            if active_task:
                task_id = active_task['id']
            else:
                return jsonify({'success': False, 'error': 'No active task found'}), 400
        
        # タスク終了
        update_task(task_id, datetime.now())
        
        # Discord通知
        send_discord_notification('✅ タスクを完了しました')
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/task/current', methods=['GET'])
def get_current_task():
    """現在のアクティブなタスクを取得"""
    try:
        active_task = get_active_task()
        
        if active_task:
            return jsonify({
                'success': True,
                'task': {
                    'id': active_task['id'],
                    'name': active_task['name'],
                    'start_at': active_task['start_at']
                }
            })
        else:
            return jsonify({
                'success': True,
                'task': None
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/note', methods=['POST'])
def add_note_api():
    """メモ追加"""
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        note_text = data.get('note', '')
        
        # task_idが指定されていない場合、アクティブなタスクを使用
        if not task_id:
            active_task = get_active_task()
            if active_task:
                task_id = active_task['id']
            else:
                return jsonify({'success': False, 'error': 'No active task found'}), 400
        
        if not note_text:
            return jsonify({'success': False, 'error': 'note is required'}), 400
        
        # メモ追加
        note_id = add_note(task_id, note_text)
        
        return jsonify({'success': True, 'note_id': note_id})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/today', methods=['GET'])
def get_today_summary():
    """今日のサマリー取得"""
    try:
        pomodoros = get_today_pomodoros()
        tasks = get_today_tasks()
        
        summary = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'pomodoros': [],
            'tasks': []
        }
        
        # ポモドーロ情報
        for pomo in pomodoros:
            pomo_data = {
                'id': pomo[0],
                'start_at': pomo[1],
                'end_at': pomo[2],
                'completed': pomo[3]
            }
            summary['pomodoros'].append(pomo_data)
        
        # タスク情報
        for task in tasks:
            task_data = {
                'id': task[0],
                'name': task[1],
                'start_at': task[2],
                'end_at': task[3],
                'status': task[4],
                'notes': get_task_notes(task[0])
            }
            summary['tasks'].append(task_data)
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)