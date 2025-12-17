AIDE Decision Intelligence Prototype
Overview

This repository contains a research-grade prototype of a regime-aware decision intelligence system designed for robust portfolio allocation under uncertainty.

The project demonstrates how decision-making can be abstracted as a system, separating:

market understanding

signal generation

decision logic

evaluation

Finance is used as the first application domain, but the architecture is intentionally domain-agnostic.

⚠️ This is a prototype / MVP, not a production trading system.

Quick Start

Run the full system end-to-end in minutes.

Steps

Clone the repository

Open AIDE_Decision_System_Final.ipynb

Run all cells top to bottom

Requirements

Python 3.9+

Jupyter Notebook

Common scientific Python libraries (numpy, pandas, matplotlib, statsmodels, hmmlearn, yfinance)

The notebook reproduces all results, plots, and evaluation metrics.

Motivation

Financial markets are non-stationary.
Most portfolio strategies assume static risk and fail when market regimes change.

This project addresses that problem by:

Detecting market regimes explicitly

Adapting alpha signals to market state

Separating knowledge from decisions

Evaluating performance using fund-grade metrics

System Architecture

The system is structured into modular layers, inspired by real-world decision systems:

Market Data
   ↓
Risk & Portfolio Construction
   ↓
Factor Attribution (Fama–French)
   ↓
Regime Detection (HMM)
   ↓
Alpha Generation & Online Learning
   ↓
Decision Layer (AIDE-style)
   ↓
Risk Controls & Transaction Costs
   ↓
Final Strategy Returns
   ↓
Benchmark Evaluation


Each layer has a single responsibility, making the system transparent, interpretable, and extensible.

Key Components
1. Data & Market Perception

Historical market prices (Yahoo Finance)

Adjusted prices for splits and dividends

Return and volatility estimation

Purpose:

“How does the market look right now?”

2. Portfolio Optimization

Mean–variance optimization

Maximum Sharpe ratio allocation

Portfolio-level return construction

Purpose:

“How should capital be allocated in principle?”

3. Factor Attribution (Fama–French)

Monthly excess return alignment

Fama–French 3-factor regression

Separation of alpha vs beta

Purpose:

“Is performance due to skill or market exposure?”

4. Regime Detection

Hidden Markov Model (HMM)

Volatility-aware regime identification

Market states: calm, stress, transition

Purpose:

“What type of market environment are we in?”

5. Alpha Generation

Multiple independent alpha models:

Momentum alpha

Mean-reversion alpha

Volatility-adjusted alpha

These alphas are combined and evaluated dynamically.

Purpose:

“What signals might provide an edge right now?”

6. Online Learning

Rolling alpha performance evaluation

Adaptive weighting of alpha signals

Continuous learning without retraining

Purpose:

“Which ideas deserve more trust right now?”

7. Regime-Conditioned Alpha Switching

Momentum favored in calm regimes

Mean reversion favored in stress regimes

Blended behavior in transition regimes

Purpose:

“Different market states require different logic.”

8. Decision Layer (AIDE-style)

A modular decision abstraction separating:

Signals

Market state

Decision policy

Risk constraints

Execution logic

This is the core contribution of the project.

Purpose:

“Given everything we know, what decision should be made?”

9. Realism & Risk

Transaction cost modeling

Turnover penalties

Risk scaling by regime

Drawdown-aware behavior

Purpose:

“Does the strategy survive real-world constraints?”

Evaluation Framework

The system is evaluated using institutional-grade metrics.

Performance Metrics

Annual return

Annual volatility

Sharpe ratio

Maximum drawdown

Benchmark Comparison

Strategy compared against SPY

Safe time-series alignment

Cumulative performance comparison

Rolling Outperformance

Rolling excess returns vs benchmark

Stability of performance over time

Information Ratio (Fund-Grade Metric)

Measures skill relative to a benchmark.

Interpretation used in this project:

IR > 1.0 → Exceptional skill

IR > 0.5 → Strong, credible edge

IR < 0 → No real edge

Results (High-Level)

Regime awareness improves drawdown control

Adaptive decision logic improves robustness

Performance improvements are persistent, not episodic

Evaluation confirms skill relative to benchmark

Limitations

Backtest-based (no live execution)

Simplified transaction cost assumptions

Regime classification is probabilistic, not perfect

Not optimized for latency or production trading

These limitations are explicitly acknowledged.

Why This Matters

This project is not just a trading strategy.

It demonstrates how decision intelligence systems can be built for:

finance

policy simulation

infrastructure planning

resource allocation

any domain involving uncertainty and changing regimes

Files

AIDE_Decision_System_Final.ipynb — complete end-to-end prototype

Disclaimer

This project is for research and educational purposes only.
It is not investment advice and not a production trading system.

Author

Anupam Singh
Independent research prototype
