/**
 * SkillsSystem - Manages 5 skill slots in the Action Bar
 * Each skill has a cooldown, icon, and effect
 */
import { eventBus } from '../core/EventBus.js';

export class SkillsSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.skills = [
            { id: 'click_boost', name: 'Click Boost', icon: '👆', cooldown: 60, currentCooldown: 0, unlocked: true },
            { id: 'income_boost', name: 'Income Boost', icon: '💰', cooldown: 90, currentCooldown: 0, unlocked: false },
            { id: 'auto_click', name: 'Auto Click', icon: '🤖', cooldown: 120, currentCooldown: 0, unlocked: false },
            { id: 'double_reward', name: 'Double Reward', icon: '✨', cooldown: 180, currentCooldown: 0, unlocked: false },
            { id: 'time_warp', name: 'Time Warp', icon: '⏰', cooldown: 300, currentCooldown: 0, unlocked: false }
        ];
        
        this.activeEffects = [];
        this.autoClickInterval = null;
        this.onSkillUse = null;
        this.onCooldownUpdate = null;
    }
    
    start() {
        this.tick();
    }
    
    stop() {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
            this.autoClickInterval = null;
        }
    }
    
    tick() {
        // Update cooldowns every second
        setTimeout(() => {
            this.skills.forEach(skill => {
                if (skill.currentCooldown > 0) {
                    skill.currentCooldown--;
                    if (this.onCooldownUpdate) {
                        this.onCooldownUpdate(skill.id, skill.currentCooldown);
                    }
                }
            });
            
            // Update active effects duration
            this.activeEffects = this.activeEffects.filter(effect => {
                effect.remaining--;
                if (effect.remaining <= 0) {
                    this.removeEffect(effect.id);
                    return false;
                }
                return true;
            });
            
            this.tick();
        }, 1000);
    }
    
    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill || !skill.unlocked) return false;
        if (skill.currentCooldown > 0) return false;
        
        // Apply skill effect
        switch (skillId) {
            case 'click_boost':
                this.applyClickBoost();
                break;
            case 'income_boost':
                this.applyIncomeBoost();
                break;
            case 'auto_click':
                this.applyAutoClick();
                break;
            case 'double_reward':
                this.applyDoubleReward();
                break;
            case 'time_warp':
                this.applyTimeWarp();
                break;
        }
        
        // Set cooldown
        skill.currentCooldown = skill.cooldown;
        
        // Emit event
        eventBus.emit('skill:used', { skillId, skill });
        
        if (this.onSkillUse) {
            this.onSkillUse(skill);
        }
        
        return true;
    }
    
    applyClickBoost() {
        const effect = {
            id: 'click_boost',
            name: 'Click Boost',
            icon: '👆',
            remaining: 30,
            multiplier: 3
        };
        this.activeEffects.push(effect);
        eventBus.emit('skill:active', { effect });
    }
    
    applyIncomeBoost() {
        const effect = {
            id: 'income_boost',
            name: 'Income Boost',
            icon: '💰',
            remaining: 60,
            multiplier: 2
        };
        this.activeEffects.push(effect);
        eventBus.emit('skill:active', { effect });
    }
    
    applyAutoClick() {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
        }
        
        this.autoClickInterval = setInterval(() => {
            this.gameState.handleClick();
        }, 500);
        
        const effect = {
            id: 'auto_click',
            name: 'Auto Click',
            icon: '🤖',
            remaining: 30,
            isInterval: true
        };
        this.activeEffects.push(effect);
        eventBus.emit('skill:active', { effect });
    }
    
    applyDoubleReward() {
        const effect = {
            id: 'double_reward',
            name: 'Double Reward',
            icon: '✨',
            remaining: 120,
            multiplier: 2
        };
        this.activeEffects.push(effect);
        eventBus.emit('skill:active', { effect });
    }
    
    applyTimeWarp() {
        // Add 60 seconds worth of income
        const rates = this.gameState.getIncomeRates();
        Object.keys(rates).forEach(resourceId => {
            if (this.gameState.resources[resourceId]) {
                this.gameState.resources[resourceId].amount += rates[resourceId] * 60;
            }
        });
        
        eventBus.emit('skill:used', { 
            skillId: 'time_warp', 
            message: 'Time Warp: +60s income!' 
        });
    }
    
    removeEffect(effectId) {
        if (effectId === 'auto_click' && this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
            this.autoClickInterval = null;
        }
        eventBus.emit('skill:deactivated', { effectId });
    }
    
    getSkills() {
        return this.skills;
    }
    
    getActiveEffects() {
        return this.activeEffects;
    }
    
    isSkillReady(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        return skill && skill.unlocked && skill.currentCooldown === 0;
    }
    
    getCooldownRemaining(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        return skill ? skill.currentCooldown : 0;
    }
    
    unlockSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (skill) {
            skill.unlocked = true;
            eventBus.emit('skill:unlocked', { skill });
        }
    }
    
    getClickMultiplier() {
        let multiplier = 1;
        this.activeEffects.forEach(effect => {
            if (effect.multiplier) {
                multiplier *= effect.multiplier;
            }
        });
        return multiplier;
    }
    
    getIncomeMultiplier() {
        let multiplier = 1;
        this.activeEffects.forEach(effect => {
            if (effect.id === 'income_boost' && effect.multiplier) {
                multiplier *= effect.multiplier;
            }
        });
        return multiplier;
    }
}

export default SkillsSystem;