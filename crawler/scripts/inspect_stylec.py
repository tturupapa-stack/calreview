#!/usr/bin/env python3
"""스타일씨 페이지 구조 확인 스크립트

Selenium을 사용하여 실제 로드된 HTML 구조를 확인합니다.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

def inspect_stylec():
    """스타일씨 페이지 구조 확인"""
    print("=" * 60)
    print("스타일씨 페이지 구조 확인 중...")
    print("=" * 60)
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        url = "https://www.stylec.co.kr/trials/"
        print(f"\n페이지 접속: {url}")
        driver.get(url)
        
        # 페이지 로드 대기
        print("페이지 로드 대기 중... (5초)")
        time.sleep(5)
        
        # 스크롤 다운 (동적 로딩 가능성)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        # 페이지 소스 가져오기
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")
        
        print(f"\n페이지 HTML 길이: {len(page_source)} bytes")
        
        # 모든 링크 찾기
        print("\n=== 링크 분석 ===")
        links = soup.select("a[href*='trial'], a[href*='campaign']")
        print(f"체험단 관련 링크: {len(links)}개")
        for i, link in enumerate(links[:10]):
            href = link.get('href', '')
            text = link.get_text(strip=True)
            classes = ' '.join(link.get('class', []))
            print(f"  {i+1}. {href[:80]} | 클래스: {classes} | 텍스트: {text[:50]}")
        
        # 모든 div 클래스 찾기
        print("\n=== div 클래스 분석 ===")
        divs = soup.find_all('div', class_=True)
        classes = set()
        for div in divs[:100]:
            classes.add(' '.join(div.get('class', [])))
        
        trial_related = [c for c in classes if 'trial' in c.lower() or 'campaign' in c.lower() or 'card' in c.lower() or 'item' in c.lower()]
        print(f"체험단 관련 클래스 ({len(trial_related)}개):")
        for cls in sorted(trial_related)[:20]:
            count = len(soup.select(f'.{cls.split()[0]}'))
            print(f"  - .{cls} ({count}개 요소)")
        
        # 이미지 찾기
        print("\n=== 이미지 분석 ===")
        images = soup.select("img[src*='trial'], img[src*='campaign'], img[alt*='체험'], img[alt*='캠페인']")
        print(f"체험단 관련 이미지: {len(images)}개")
        for i, img in enumerate(images[:5]):
            src = img.get('src', '')
            alt = img.get('alt', '')
            print(f"  {i+1}. src: {src[:80]} | alt: {alt[:50]}")
        
        # 텍스트로 체험단 찾기
        print("\n=== 텍스트 분석 ===")
        elements_with_trial = soup.find_all(string=lambda text: text and ('체험단' in text or '캠페인' in text or '모집' in text))
        print(f"'체험단' 또는 '캠페인' 텍스트를 포함하는 요소: {len(elements_with_trial)}개")
        for i, elem in enumerate(elements_with_trial[:10]):
            parent = elem.parent
            tag = parent.name if parent else 'unknown'
            classes = ' '.join(parent.get('class', [])) if parent and parent.get('class') else ''
            text = str(elem)[:100]
            print(f"  {i+1}. <{tag} class='{classes}'> {text}")
        
        # HTML 저장 (디버깅용)
        output_file = "/tmp/stylec_inspected.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(page_source)
        print(f"\n전체 HTML 저장: {output_file}")
        
        print("\n" + "=" * 60)
        print("분석 완료!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    inspect_stylec()
